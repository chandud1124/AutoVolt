const express = require('express');
const router = express.Router();
const smartScheduleService = require('../services/smartScheduleService');
const { authorize } = require('../middleware/auth');
const { auth } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

/**
 * @route   GET /api/smart-schedule/recommendations
 * @desc    Get recommendations for all devices
 * @access  Private (admin/super-admin)
 */
router.get('/recommendations', auth, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    logger.info('[SmartSchedule API] Getting recommendations for all devices');

    const recommendations = await smartScheduleService.getDeviceRecommendations();

    res.json({
      success: true,
      data: {
        total: recommendations.length,
        recommendations: recommendations.sort((a, b) => 
          (b.predictedSavings?.percentage || 0) - (a.predictedSavings?.percentage || 0)
        )
      }
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations'
    });
  }
});

/**
 * @route   POST /api/smart-schedule/cache/clear
 * @desc    Clear prediction cache
 * @access  Private (admin/super-admin)
 */
router.post('/cache/clear', auth, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { deviceId } = req.body;

    smartScheduleService.clearCache(deviceId);

    res.json({
      success: true,
      message: deviceId 
        ? `Cache cleared for device ${deviceId}` 
        : 'All prediction cache cleared'
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Cache clear error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear cache'
    });
  }
});

/**
 * @route   GET /api/smart-schedule/cache/stats
 * @desc    Get cache statistics
 * @access  Private (admin/super-admin)
 */
router.get('/cache/stats', auth, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const stats = smartScheduleService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cache stats'
    });
  }
});

/**
 * @route   GET /api/smart-schedule/:deviceId/analyze
 * @desc    Analyze usage patterns and get smart schedule recommendations
 * @access  Private
 */
router.get('/:deviceId/analyze', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { switchId, days } = req.query;

    logger.info(`[SmartSchedule API] Analyzing device ${deviceId}, switchId: ${switchId || 'all'}`);

    const result = await smartScheduleService.analyzeSchedule(
      deviceId,
      switchId || null
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze schedule'
    });
  }
});

/**
 * @route   GET /api/smart-schedule/:deviceId/predictions
 * @desc    Get predicted schedule for a device
 * @access  Private
 */
router.get('/:deviceId/predictions', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { switchId } = req.query;

    const analysis = await smartScheduleService.analyzeSchedule(deviceId, switchId);

    if (analysis.status !== 'success') {
      return res.json({
        success: false,
        message: analysis.message || 'Unable to generate predictions',
        data: analysis
      });
    }

    res.json({
      success: true,
      data: {
        deviceId,
        switchId: switchId || null,
        predictions: analysis.predictions,
        smart_schedule: analysis.smart_schedule,
        confidence: analysis.confidence,
        analysis: analysis.analysis
      }
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Predictions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get predictions'
    });
  }
});

/**
 * @route   POST /api/smart-schedule/:deviceId/predict-next
 * @desc    Predict next state change time
 * @access  Private
 */
router.post('/:deviceId/predict-next', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { switchId, currentState, lastChangeTime, patterns } = req.body;

    if (currentState === undefined || !lastChangeTime || !patterns) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: currentState, lastChangeTime, patterns'
      });
    }

    const result = await smartScheduleService.predictNextChange(
      deviceId,
      switchId,
      currentState,
      lastChangeTime,
      patterns
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Predict next error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to predict next change'
    });
  }
});

/**
 * @route   GET /api/smart-schedule/:deviceId/confidence
 * @desc    Get prediction confidence scores
 * @access  Private
 */
router.get('/:deviceId/confidence', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { switchId } = req.query;

    const analysis = await smartScheduleService.analyzeSchedule(deviceId, switchId);

    res.json({
      success: true,
      data: {
        deviceId,
        switchId: switchId || null,
        confidence: analysis.confidence || {},
        status: analysis.status,
        dataPoints: analysis.analysis?.total_events || 0,
        dateRange: analysis.analysis?.date_range || null
      }
    });

  } catch (error) {
    logger.error('[SmartSchedule API] Confidence error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get confidence scores'
    });
  }
});

module.exports = router;
