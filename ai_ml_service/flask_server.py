from flask import Flask, jsonify, request
from flask_cors import CORS
import time
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health')
def health():
    try:
        return jsonify({
            "status": "healthy",
            "prophet_available": False,
            "scikit_available": True,
            "mlflow_available": False,
            "advanced_ai_available": False,
            "timestamp": time.time()
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/forecast', methods=['GET', 'POST'])
def forecast():
    try:
        # Handle POST data if needed, but for now return mock data
        # data = request.get_json()
        
        # Generate 24 hours of mock data based on real time
        forecast_data = []
        confidence_data = []
        
        now = datetime.now()
        
        for i in range(24):
            # Calculate the hour for this data point (starting next hour)
            future_time = now + timedelta(hours=i+1)
            hour = future_time.hour
            
            # Logic: High consumption between 8 AM and 6 PM (18:00)
            if 8 <= hour < 18:
                # Active hours: 150W - 350W (simulating lab equipment)
                val = random.uniform(150, 350)
                # Add a peak around 2 PM (14:00)
                if 13 <= hour <= 15:
                    val += random.uniform(50, 100)
            else:
                # Off hours: 0W - 5W (standby/phantom load)
                val = random.uniform(0, 5)
            
            forecast_data.append(round(val, 1))
            confidence_data.append(0.8)

        return jsonify({
            "device_id": "test",
            "forecast": forecast_data,
            "confidence": confidence_data,
            "timestamp": time.time(),
            "model_type": "time_aware_mock_24h"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/anomaly', methods=['GET', 'POST'])
def anomaly():
    try:
        return jsonify({
            "device_id": "test",
            "anomalies": [],
            "scores": [0.1, 0.2, 0.1, 0.15, 0.1],
            "threshold": 0.5,
            "timestamp": time.time()
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/schedule', methods=['GET', 'POST'])
def schedule():
    try:
        return jsonify({
            "device_id": "test",
            "schedule": {
                "monday": {"start": "08:00", "end": "18:00", "priority": "high"},
                "tuesday": {"start": "08:00", "end": "18:00", "priority": "high"},
                "wednesday": {"start": "08:00", "end": "18:00", "priority": "high"},
                "thursday": {"start": "08:00", "end": "18:00", "priority": "high"},
                "friday": {"start": "08:00", "end": "18:00", "priority": "high"},
                "saturday": {"start": "09:00", "end": "17:00", "priority": "medium"},
                "sunday": {"start": "off", "end": "off", "priority": "off"}
            },
            "energy_savings": 15,
            "timestamp": time.time()
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("Starting AI/ML Fallback Server on port 8002...")
    app.run(host='0.0.0.0', port=8002, debug=False)