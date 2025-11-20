from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta

app = FastAPI(title="Minimal AI/ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Minimal service running"
    }

@app.get("/forecast")
async def forecast():
    # Generate 24-hour forecast with time-based patterns
    current_time = datetime.now()
    forecasts = []
    confidences = []
    
    for i in range(24):
        future_time = current_time + timedelta(hours=i+1)
        future_hour = future_time.hour
        future_minute = future_time.minute
        
        # Major consumption: 9 AM - 5 PM
        if 9 <= future_hour < 17:
            forecasts.append(50.0)  # Peak consumption
            confidences.append(0.85)
        # Low consumption: 5 PM - 6:30 PM (computer lab)
        elif 17 <= future_hour < 18 or (future_hour == 18 and future_minute < 30):
            forecasts.append(15.0)  # Computer lab only
            confidences.append(0.8)
        # Zero consumption: After 6:30 PM and before 9 AM
        else:
            forecasts.append(0.0)  # No consumption
            confidences.append(0.9)
    
    return {
        "forecast": forecasts,
        "confidence": confidences
    }

@app.get("/anomaly")
async def anomaly():
    return {
        "anomalies": [],
        "scores": [0.1, 0.2, 0.1, 0.15, 0.1]
    }