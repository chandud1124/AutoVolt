"""
Smart Scheduler - AI-Powered Switch Scheduling Predictor
Predicts optimal on/off times for switches based on historical usage patterns
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class SmartScheduler:
    """AI-based smart scheduler for predicting optimal switch on/off times"""
    
    def __init__(self):
        self.min_data_points = 7  # Need at least 7 days of data
        self.confidence_threshold = 0.6
        
    def analyze_usage_patterns(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze historical switch usage patterns
        
        Args:
            historical_data: List of switch state changes with timestamps
            Format: [{"timestamp": "2024-11-17T08:30:00", "state": true, "switchId": "...", "switchName": "..."}]
            
        Returns:
            Dictionary with usage patterns, peak times, and recommendations
        """
        try:
            if len(historical_data) < self.min_data_points:
                return {
                    "status": "insufficient_data",
                    "message": f"Need at least {self.min_data_points} data points for analysis",
                    "data_points": len(historical_data)
                }
            
            # Convert to DataFrame
            df = pd.DataFrame(historical_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Extract time features
            df['hour'] = df['timestamp'].dt.hour
            df['minute'] = df['timestamp'].dt.minute
            df['day_of_week'] = df['timestamp'].dt.dayofweek  # 0=Monday, 6=Sunday
            df['is_weekend'] = df['day_of_week'].isin([5, 6])
            df['date'] = df['timestamp'].dt.date
            
            # Analyze ON times
            on_events = df[df['state'] == True].copy()
            off_events = df[df['state'] == False].copy()
            
            # Calculate usage patterns
            patterns = self._calculate_patterns(on_events, off_events, df)
            
            # Generate predictions
            predictions = self._generate_predictions(patterns, df)
            
            # Calculate confidence scores
            confidence = self._calculate_confidence(patterns, on_events, off_events)
            
            # Generate smart schedule
            schedule = self._generate_smart_schedule(patterns, predictions, confidence)
            
            return {
                "status": "success",
                "analysis": {
                    "total_events": len(df),
                    "on_events": len(on_events),
                    "off_events": len(off_events),
                    "date_range": {
                        "start": df['timestamp'].min().isoformat(),
                        "end": df['timestamp'].max().isoformat(),
                        "days": (df['timestamp'].max() - df['timestamp'].min()).days
                    }
                },
                "patterns": patterns,
                "predictions": predictions,
                "confidence": confidence,
                "smart_schedule": schedule,
                "recommendations": self._generate_recommendations(patterns, confidence)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing usage patterns: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def _calculate_patterns(self, on_events: pd.DataFrame, off_events: pd.DataFrame, 
                          all_events: pd.DataFrame) -> Dict[str, Any]:
        """Calculate usage patterns from historical data"""
        
        patterns = {}
        
        # Peak ON hours (weekday vs weekend)
        if len(on_events) > 0:
            weekday_on = on_events[~on_events['is_weekend']]
            weekend_on = on_events[on_events['is_weekend']]
            
            patterns['peak_on_hours'] = {
                "weekday": self._get_peak_hours(weekday_on),
                "weekend": self._get_peak_hours(weekend_on),
                "overall": self._get_peak_hours(on_events)
            }
        
        # Peak OFF hours
        if len(off_events) > 0:
            weekday_off = off_events[~off_events['is_weekend']]
            weekend_off = off_events[off_events['is_weekend']]
            
            patterns['peak_off_hours'] = {
                "weekday": self._get_peak_hours(weekday_off),
                "weekend": self._get_peak_hours(weekend_off),
                "overall": self._get_peak_hours(off_events)
            }
        
        # Usage frequency by day of week
        if len(all_events) > 0:
            day_freq = all_events.groupby('day_of_week').size().to_dict()
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            patterns['usage_by_day'] = {
                day_names[day]: freq for day, freq in day_freq.items()
            }
        
        # Average daily usage hours
        if len(on_events) > 0 and len(off_events) > 0:
            # Calculate duration for each day
            daily_usage = defaultdict(list)
            for date in all_events['date'].unique():
                day_events = all_events[all_events['date'] == date].sort_values('timestamp')
                
                if len(day_events) >= 2:
                    # Calculate total ON time for the day
                    on_time = 0
                    current_state = day_events.iloc[0]['state']
                    last_time = day_events.iloc[0]['timestamp']
                    
                    for _, event in day_events.iloc[1:].iterrows():
                        if current_state:  # Was ON
                            on_time += (event['timestamp'] - last_time).total_seconds() / 3600
                        current_state = event['state']
                        last_time = event['timestamp']
                    
                    daily_usage['hours'].append(on_time)
            
            if daily_usage['hours']:
                patterns['average_daily_hours'] = {
                    "mean": float(np.mean(daily_usage['hours'])),
                    "median": float(np.median(daily_usage['hours'])),
                    "min": float(np.min(daily_usage['hours'])),
                    "max": float(np.max(daily_usage['hours']))
                }
        
        # Common time windows (clustering)
        if len(on_events) > 0:
            patterns['common_on_windows'] = self._find_time_clusters(on_events)
        
        if len(off_events) > 0:
            patterns['common_off_windows'] = self._find_time_clusters(off_events)
        
        return patterns
    
    def _get_peak_hours(self, events: pd.DataFrame) -> Dict[str, Any]:
        """Get peak hours from events"""
        if len(events) == 0:
            return {"hours": [], "counts": {}}
        
        hour_counts = events['hour'].value_counts().to_dict()
        top_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            "top_3_hours": [{"hour": hour, "count": count, "time": f"{hour:02d}:00"} 
                           for hour, count in top_hours],
            "distribution": hour_counts,
            "most_common": int(events['hour'].mode()[0]) if len(events) > 0 else None
        }
    
    def _find_time_clusters(self, events: pd.DataFrame, tolerance_minutes: int = 30) -> List[Dict[str, Any]]:
        """Find common time windows where switches are typically operated"""
        if len(events) == 0:
            return []
        
        # Convert to minutes since midnight
        events = events.copy()
        events['minutes'] = events['hour'] * 60 + events['minute']
        
        # Group nearby times (within tolerance)
        clusters = []
        sorted_times = sorted(events['minutes'].unique())
        
        if not sorted_times:
            return []
        
        current_cluster = [sorted_times[0]]
        
        for time in sorted_times[1:]:
            if time - current_cluster[-1] <= tolerance_minutes:
                current_cluster.append(time)
            else:
                # Save current cluster
                avg_time = int(np.mean(current_cluster))
                clusters.append({
                    "window": f"{avg_time // 60:02d}:{avg_time % 60:02d}",
                    "count": len(events[events['minutes'].isin(current_cluster)]),
                    "range_minutes": [min(current_cluster), max(current_cluster)]
                })
                current_cluster = [time]
        
        # Don't forget last cluster
        if current_cluster:
            avg_time = int(np.mean(current_cluster))
            clusters.append({
                "window": f"{avg_time // 60:02d}:{avg_time % 60:02d}",
                "count": len(events[events['minutes'].isin(current_cluster)]),
                "range_minutes": [min(current_cluster), max(current_cluster)]
            })
        
        # Sort by count
        return sorted(clusters, key=lambda x: x['count'], reverse=True)
    
    def _generate_predictions(self, patterns: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """Generate predictions for when switches will be on/off"""
        
        predictions = {
            "weekday": {},
            "weekend": {}
        }
        
        # Predict ON times
        if 'peak_on_hours' in patterns:
            predictions['weekday']['on_time'] = self._predict_time_from_peaks(
                patterns['peak_on_hours'].get('weekday', {})
            )
            predictions['weekend']['on_time'] = self._predict_time_from_peaks(
                patterns['peak_on_hours'].get('weekend', {})
            )
        
        # Predict OFF times
        if 'peak_off_hours' in patterns:
            predictions['weekday']['off_time'] = self._predict_time_from_peaks(
                patterns['peak_off_hours'].get('weekday', {})
            )
            predictions['weekend']['off_time'] = self._predict_time_from_peaks(
                patterns['peak_off_hours'].get('weekend', {})
            )
        
        # Predict duration
        if 'average_daily_hours' in patterns:
            predictions['average_duration_hours'] = patterns['average_daily_hours']['mean']
        
        return predictions
    
    def _predict_time_from_peaks(self, peak_data: Dict[str, Any]) -> str:
        """Predict most likely time from peak hours"""
        if not peak_data or 'top_3_hours' not in peak_data:
            return "00:00"
        
        top_hours = peak_data['top_3_hours']
        if not top_hours:
            return "00:00"
        
        # Return most common hour
        return top_hours[0]['time']
    
    def _calculate_confidence(self, patterns: Dict[str, Any], 
                            on_events: pd.DataFrame, off_events: pd.DataFrame) -> Dict[str, float]:
        """Calculate confidence scores for predictions"""
        
        confidence = {
            "overall": 0.0,
            "weekday_on": 0.0,
            "weekday_off": 0.0,
            "weekend_on": 0.0,
            "weekend_off": 0.0
        }
        
        # Confidence based on data consistency
        total_days = (on_events['timestamp'].max() - on_events['timestamp'].min()).days if len(on_events) > 0 else 0
        
        if total_days >= 30:
            base_confidence = 0.9
        elif total_days >= 14:
            base_confidence = 0.7
        elif total_days >= 7:
            base_confidence = 0.5
        else:
            base_confidence = 0.3
        
        # Check consistency of patterns
        if 'peak_on_hours' in patterns and 'weekday' in patterns['peak_on_hours']:
            weekday_on = patterns['peak_on_hours']['weekday']
            if weekday_on.get('top_3_hours'):
                top_count = weekday_on['top_3_hours'][0]['count']
                total_events = len(on_events[~on_events['is_weekend']])
                if total_events > 0:
                    consistency = top_count / total_events
                    confidence['weekday_on'] = min(0.95, base_confidence * consistency * 1.2)
        
        # Similar calculations for other confidence scores
        confidence['overall'] = base_confidence
        confidence['weekday_off'] = confidence['weekday_on'] * 0.9  # Slightly lower
        confidence['weekend_on'] = base_confidence * 0.8  # Weekend patterns less consistent
        confidence['weekend_off'] = base_confidence * 0.8
        
        return confidence
    
    def _generate_smart_schedule(self, patterns: Dict[str, Any], 
                                predictions: Dict[str, Any], 
                                confidence: Dict[str, float]) -> Dict[str, Any]:
        """Generate recommended smart schedule"""
        
        schedule = {
            "monday": {},
            "tuesday": {},
            "wednesday": {},
            "thursday": {},
            "friday": {},
            "saturday": {},
            "sunday": {}
        }
        
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"]
        weekends = ["saturday", "sunday"]
        
        # Apply weekday predictions
        if confidence.get('weekday_on', 0) >= self.confidence_threshold:
            for day in weekdays:
                schedule[day] = {
                    "predicted_on": predictions['weekday'].get('on_time', 'Not enough data'),
                    "predicted_off": predictions['weekday'].get('off_time', 'Not enough data'),
                    "confidence": round(confidence.get('weekday_on', 0) * 100, 1),
                    "recommendation": self._get_recommendation(
                        predictions['weekday'].get('on_time'),
                        predictions['weekday'].get('off_time'),
                        confidence.get('weekday_on', 0)
                    )
                }
        else:
            for day in weekdays:
                schedule[day] = {
                    "status": "insufficient_confidence",
                    "confidence": round(confidence.get('weekday_on', 0) * 100, 1),
                    "recommendation": "Continue collecting data for accurate predictions"
                }
        
        # Apply weekend predictions
        if confidence.get('weekend_on', 0) >= self.confidence_threshold:
            for day in weekends:
                schedule[day] = {
                    "predicted_on": predictions['weekend'].get('on_time', 'Not enough data'),
                    "predicted_off": predictions['weekend'].get('off_time', 'Not enough data'),
                    "confidence": round(confidence.get('weekend_on', 0) * 100, 1),
                    "recommendation": self._get_recommendation(
                        predictions['weekend'].get('on_time'),
                        predictions['weekend'].get('off_time'),
                        confidence.get('weekend_on', 0)
                    )
                }
        else:
            for day in weekends:
                schedule[day] = {
                    "status": "insufficient_confidence",
                    "confidence": round(confidence.get('weekend_on', 0) * 100, 1),
                    "recommendation": "Continue collecting data for accurate predictions"
                }
        
        return schedule
    
    def _get_recommendation(self, on_time: str, off_time: str, confidence: float) -> str:
        """Generate human-readable recommendation"""
        if confidence >= 0.8:
            return f"High confidence: Schedule ON at {on_time}, OFF at {off_time}"
        elif confidence >= 0.6:
            return f"Moderate confidence: Consider scheduling ON at {on_time}, OFF at {off_time}"
        else:
            return "Low confidence: Need more usage data for accurate scheduling"
    
    def _generate_recommendations(self, patterns: Dict[str, Any], 
                                 confidence: Dict[str, float]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Check if enough data
        if confidence.get('overall', 0) < 0.5:
            recommendations.append("📊 Collect at least 2 weeks of usage data for better predictions")
        
        # Check usage consistency
        if 'usage_by_day' in patterns:
            usage_by_day = patterns['usage_by_day']
            if usage_by_day:
                min_usage = min(usage_by_day.values())
                max_usage = max(usage_by_day.values())
                if max_usage > min_usage * 3:
                    recommendations.append("📅 Usage varies significantly by day - consider separate schedules for different days")
        
        # Check for energy saving opportunities
        if 'average_daily_hours' in patterns:
            avg_hours = patterns['average_daily_hours']['mean']
            if avg_hours > 12:
                recommendations.append(f"⚡ High usage detected ({avg_hours:.1f} hours/day) - consider motion sensors or timers to reduce energy waste")
            elif avg_hours < 4:
                recommendations.append(f"💡 Low usage detected ({avg_hours:.1f} hours/day) - automated scheduling may not provide significant benefits")
        
        # Weekend vs weekday patterns
        if 'usage_by_day' in patterns:
            weekday_avg = np.mean([patterns['usage_by_day'].get(day, 0) 
                                  for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']])
            weekend_avg = np.mean([patterns['usage_by_day'].get(day, 0) 
                                  for day in ['Saturday', 'Sunday']])
            
            if weekday_avg > weekend_avg * 2:
                recommendations.append("🏫 Weekend usage is significantly lower - consider different schedules for weekends")
        
        # Peak time recommendations
        if 'peak_on_hours' in patterns and 'weekday' in patterns['peak_on_hours']:
            top_hours = patterns['peak_on_hours']['weekday'].get('top_3_hours', [])
            if top_hours:
                peak_hour = top_hours[0]['hour']
                if peak_hour < 6:
                    recommendations.append("🌅 Early morning usage detected - verify if switches are left on overnight")
                elif peak_hour >= 22:
                    recommendations.append("🌙 Late night usage detected - consider automatic shutdown timers")
        
        if not recommendations:
            recommendations.append("✅ Usage patterns look optimal - continue current practices")
        
        return recommendations
    
    def predict_next_state_change(self, current_state: bool, last_change_time: str, 
                                  patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Predict when the next state change is likely to occur"""
        try:
            last_change = datetime.fromisoformat(last_change_time.replace('Z', '+00:00'))
            now = datetime.now()
            current_hour = now.hour
            current_day = now.weekday()
            is_weekend = current_day in [5, 6]
            
            # Determine which patterns to use
            pattern_key = 'weekend' if is_weekend else 'weekday'
            target_pattern = 'peak_off_hours' if current_state else 'peak_on_hours'
            
            if target_pattern not in patterns or pattern_key not in patterns[target_pattern]:
                return {
                    "status": "insufficient_data",
                    "message": "Not enough historical data for prediction"
                }
            
            peak_hours = patterns[target_pattern][pattern_key].get('top_3_hours', [])
            if not peak_hours:
                return {
                    "status": "insufficient_data",
                    "message": "No peak hours data available"
                }
            
            # Find next likely change time
            most_likely_hour = peak_hours[0]['hour']
            
            # Calculate predicted time
            predicted_time = now.replace(hour=most_likely_hour, minute=0, second=0, microsecond=0)
            
            # If predicted time is in the past today, move to tomorrow
            if predicted_time < now:
                predicted_time += timedelta(days=1)
            
            # Calculate confidence based on data consistency
            confidence = min(0.9, peak_hours[0]['count'] / sum(p['count'] for p in peak_hours))
            
            return {
                "status": "prediction_available",
                "current_state": "ON" if current_state else "OFF",
                "predicted_next_state": "OFF" if current_state else "ON",
                "predicted_time": predicted_time.isoformat(),
                "time_until_change": str(predicted_time - now),
                "confidence": round(confidence * 100, 1),
                "alternative_times": [
                    {
                        "time": f"{ph['hour']:02d}:00",
                        "probability": round((ph['count'] / sum(p['count'] for p in peak_hours)) * 100, 1)
                    }
                    for ph in peak_hours
                ]
            }
            
        except Exception as e:
            logger.error(f"Error predicting next state change: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
