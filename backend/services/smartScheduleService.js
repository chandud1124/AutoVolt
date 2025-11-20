const axios = require('axios');
const ActivityLog = require('../models/ActivityLog');
const Device = require('../models/Device');
const { logger } = require('../middleware/logger');

// AI/ML Service URL
const AI_ML_SERVICE_URL = process.env.AI_ML_SERVICE_URL || 'http://localhost:8002';

// Cache for predictions (TTL: 1 hour)
const predictionCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

class SmartScheduleService {
  /**
   * Get historical switch activity for analysis
   * @param {String} deviceId - Device ID
   * @param {String} switchId - Optional switch ID to filter
   * @param {Number} days - Number of days of history to fetch (default: 30)
   */
  async getHistoricalActivity(deviceId, switchId = null, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = {
        deviceId,
        timestamp: { $gte: startDate },
        action: { $in: ['switch_on', 'switch_off'] }
      };

      if (switchId) {
        query.switchId = switchId;
      }

      const logs = await ActivityLog.find(query)
        .sort({ timestamp: 1 })
        .select('timestamp action switchId switchName deviceId')
        .lean();

      // Transform to format expected by AI service
      const historicalData = logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        state: log.action === 'switch_on',
        switchId: log.switchId,
        switchName: log.switchName || 'Unknown'
      }));

      return historicalData;
    } catch (error) {
      logger.error('[SmartSchedule] Error fetching historical activity:', error);
      throw error;
    }
  }

  /**
   * Analyze usage patterns and get smart schedule recommendations
   * @param {String} deviceId - Device ID
   * @param {String} switchId - Optional switch ID
   */
  async analyzeSchedule(deviceId, switchId = null) {
    try {
      // Check cache first
      const cacheKey = `${deviceId}_${switchId || 'all'}`;
      const cached = predictionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        logger.info(`[SmartSchedule] Using cached prediction for ${cacheKey}`);
        return cached.data;
      }

      // Fetch historical data
      logger.info(`[SmartSchedule] Fetching historical data for device ${deviceId}`);
      const historicalData = await this.getHistoricalActivity(deviceId, switchId);

      if (historicalData.length === 0) {
        return {
          status: 'no_data',
          message: 'No historical switch activity found for this device',
          deviceId,
          switchId
        };
      }

      // Call AI/ML service
      logger.info(`[SmartSchedule] Analyzing ${historicalData.length} data points`);
      const response = await axios.post(
        `${AI_ML_SERVICE_URL}/smart-schedule/analyze`,
        {
          device_id: deviceId,
          switch_id: switchId,
          historical_data: historicalData
        },
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data;

      // Cache the result
      predictionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logger.info(`[SmartSchedule] Analysis complete for ${cacheKey}, status: ${result.status}`);
      return result;

    } catch (error) {
      if (error.response) {
        logger.error('[SmartSchedule] AI/ML service error:', error.response.data);
        throw new Error(`AI/ML service error: ${error.response.data.detail || 'Unknown error'}`);
      } else if (error.request) {
        logger.error('[SmartSchedule] AI/ML service unreachable');
        throw new Error('AI/ML service is currently unavailable');
      } else {
        logger.error('[SmartSchedule] Error analyzing schedule:', error);
        throw error;
      }
    }
  }

  /**
   * Predict next state change time
   * @param {String} deviceId - Device ID
   * @param {String} switchId - Switch ID
   * @param {Boolean} currentState - Current switch state
   * @param {String} lastChangeTime - ISO timestamp of last state change
   * @param {Object} patterns - Usage patterns from analysis
   */
  async predictNextChange(deviceId, switchId, currentState, lastChangeTime, patterns) {
    try {
      const response = await axios.post(
        `${AI_ML_SERVICE_URL}/smart-schedule/predict-next`,
        {
          device_id: deviceId,
          switch_id: switchId,
          current_state: currentState,
          last_change_time: lastChangeTime,
          patterns: patterns
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      if (error.response) {
        logger.error('[SmartSchedule] Prediction error:', error.response.data);
        throw new Error(`Prediction error: ${error.response.data.detail || 'Unknown error'}`);
      } else if (error.request) {
        logger.error('[SmartSchedule] AI/ML service unreachable');
        throw new Error('AI/ML service is currently unavailable');
      } else {
        logger.error('[SmartSchedule] Error predicting next change:', error);
        throw error;
      }
    }
  }

  /**
   * Get recommendations for all devices
   */
  async getDeviceRecommendations() {
    try {
      // Get all devices with switches
      const devices = await Device.find({
        status: { $in: ['online', 'offline'] },
        'switches.0': { $exists: true }
      }).select('name classroom switches').lean();

      const recommendations = [];

      for (const device of devices) {
        try {
          const analysis = await this.analyzeSchedule(device._id.toString());
          
          if (analysis.status === 'success' && analysis.recommendations) {
            recommendations.push({
              deviceId: device._id,
              deviceName: device.name,
              classroom: device.classroom,
              switchCount: device.switches.length,
              confidence: analysis.confidence?.overall || 0,
              recommendations: analysis.recommendations,
              predictedSavings: this.estimateEnergySavings(analysis)
            });
          }
        } catch (error) {
          logger.error(`[SmartSchedule] Error analyzing device ${device._id}:`, error.message);
          // Continue with other devices
        }
      }

      return recommendations;

    } catch (error) {
      logger.error('[SmartSchedule] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Estimate energy savings from smart scheduling
   * @param {Object} analysis - Analysis result from AI service
   */
  estimateEnergySavings(analysis) {
    try {
      if (!analysis.predictions || !analysis.patterns) {
        return { percentage: 0, confidence: 'low' };
      }

      const avgDailyHours = analysis.patterns.average_daily_hours?.mean || 0;
      const confidence = analysis.confidence?.overall || 0;

      // Estimate potential savings based on usage patterns
      let savingsPercentage = 0;

      // High usage devices have more savings potential
      if (avgDailyHours > 12) {
        savingsPercentage = 15 + (avgDailyHours - 12) * 2; // 15-30% savings
      } else if (avgDailyHours > 8) {
        savingsPercentage = 10 + (avgDailyHours - 8) * 1.25; // 10-15% savings
      } else if (avgDailyHours > 4) {
        savingsPercentage = 5 + (avgDailyHours - 4) * 1.25; // 5-10% savings
      } else {
        savingsPercentage = 3; // 3% savings for low usage
      }

      // Cap at 35%
      savingsPercentage = Math.min(35, savingsPercentage);

      return {
        percentage: Math.round(savingsPercentage * 10) / 10,
        confidence: confidence >= 0.7 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
        avgDailyHours: Math.round(avgDailyHours * 10) / 10
      };

    } catch (error) {
      logger.error('[SmartSchedule] Error estimating savings:', error);
      return { percentage: 0, confidence: 'low' };
    }
  }

  /**
   * Clear prediction cache
   */
  clearCache(deviceId = null) {
    if (deviceId) {
      // Clear specific device cache
      for (const key of predictionCache.keys()) {
        if (key.startsWith(deviceId)) {
          predictionCache.delete(key);
        }
      }
      logger.info(`[SmartSchedule] Cleared cache for device ${deviceId}`);
    } else {
      // Clear all cache
      predictionCache.clear();
      logger.info('[SmartSchedule] Cleared all prediction cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: predictionCache.size,
      entries: Array.from(predictionCache.keys()),
      ttl_ms: CACHE_TTL
    };
  }
}

module.exports = new SmartScheduleService();
