# AutoVolt – Smart IoT Classroom Automation System

AutoVolt is a final-year group project that delivers end-to-end IoT classroom automation. It is deployed in six college classrooms/labs, powering real-time control of lights, fans, and other loads from a centralized web dashboard. The system pairs ESP32 microcontrollers with an MQTT backbone and a full-stack web app to reduce power consumption by shutting devices off when no motion is detected while keeping staff in control.

## Highlights
- Real-world deployment: running today across six classrooms with stable operations.
- Energy savings: motion-aware auto-off policies reduce idle power draw.
- Control anywhere: web dashboard plus Capacitor-based mobile app for live status and overrides.
- Alerts & chatops: Telegram bot integration for notifications and quick command triggers.
- Local-only control: deployed on a dedicated on-prem server and LAN; no open internet exposure.
- Reliable edge: ESP32 devices using MQTT for responsive, low-latency updates.
- Observability & delivery: Prometheus/Grafana stack and collaborative hardware–software rollout.

## System Overview
- **Frontend**: React + Vite + Tailwind CSS with Capacitor for mobile/Android packaging and on-the-go control.
- **Backend**: Node.js/Express API, MQTT broker integration, MongoDB persistence, Socket.IO for realtime updates, and Telegram bot hooks for alerts/commands; deployed on a local server within the campus network, not exposed to the public internet.
- **Edge/Devices**: ESP32 microcontrollers controlling relays and reading motion sensors; publish/subscribe over MQTT topics for commands and telemetry.
- **AI/ML Service (optional)**: Python service with YOLOv8 for computer-vision-assisted insights.
- **Monitoring**: Prometheus scrapes services; Grafana dashboards show classroom state, device metrics, and alerts.

## Repository Layout
- Root web app (Vite/React) for the operator dashboard.
- [backend](backend) Node.js API and MQTT handling.
- [ai_ml_service](ai_ml_service) optional vision/ML helper service.
- [esp32](esp32) firmware and headers for device-side configuration.
- Infrastructure: Docker Compose files, Grafana provisioning, Mosquitto config, and deployment scripts.

## Prerequisites
- Node.js 18+ and npm.
- Python 3.10+ (for ai_ml_service).
- MongoDB instance.
- MQTT broker (local Mosquitto config provided in mosquitto.conf).
- Optional: Docker/Docker Compose for bundled services, Grafana/Prometheus for monitoring.

## Local Development
1) Install dependencies for the web app:

```
npm install
```

2) Start the frontend dev server:

```
npm run dev
```

3) Start the backend API:

```
cd backend
npm install
npm run dev
```

4) (Optional) Start the AI/ML helper service:

```
cd ai_ml_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

5) Bring up MQTT and monitoring with Docker (optional):

```
docker compose up -d
```

## Environment Configuration
Create .env files for each service (sample keys below). Do not commit secrets.

**Frontend (root)**
- VITE_API_URL
- VITE_MQTT_URL (if using websockets)

**Backend**
- MONGODB_URI
- JWT_SECRET
- MQTT_BROKER_URL / MQTT_USERNAME / MQTT_PASSWORD
- SMTP_* (if email alerts are enabled)
- TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (for Telegram notifications/commands)

**AI/ML Service**
- MODEL_PATH
- MQTT_BROKER_URL

## Hardware/Device Setup
- Flash ESP32 firmware from [esp32](esp32) with Wi-Fi and MQTT broker credentials.
- Wire relays to classroom loads and connect motion/PIR sensors for presence detection.
- Device topics (example): `classroom/<room-id>/command` for inbound commands, `classroom/<room-id>/status` for telemetry, and `classroom/<room-id>/motion` for sensor events.
- Verify broker connectivity and test manual commands from the web dashboard before enabling automation policies.

## Deployment Notes
- The system is currently installed in six classrooms; keep broker credentials and network SSIDs consistent across devices.
- Use Docker Compose for repeatable deployments of the backend, MQTT broker, and monitoring stack.
- Provision Grafana with the included dashboards to track uptime, message rates, and energy-saving behavior.
- Set up alerts for offline devices, MQTT disconnects, and sensor inactivity to catch issues early.
- Keep control surfaces on the campus LAN/VPN; do not expose the MQTT broker or API to the public internet.

## Testing
- Frontend: `npm test`
- Backend: `cd backend && npm test`
- AI/ML service: `cd ai_ml_service && pytest`

## License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
