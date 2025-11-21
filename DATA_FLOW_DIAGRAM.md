# AutoVolt IoT Classroom Automation System - Data Flow Diagram (DFD)

```mermaid
graph TD
    %% External Entities
    A[User<br/>Web/Mobile App] --> B[Frontend<br/>React + Vite]
    C[ESP32 Devices] --> D[MQTT Broker<br/>Aedes]
    E[AI/ML Service<br/>Python FastAPI] --> F[Backend API<br/>Node.js + Express]
    G[Telegram Bot] --> H[Telegram API]

    %% Main Processing
    B --> I[API Gateway<br/>Authentication & Routing]
    D --> J[MQTT Handler<br/>Device Communication]
    H --> K[Telegram Handler<br/>Bot Commands]

    %% Core Backend Components
    I --> L[Authentication Service<br/>JWT + Role-based Access]
    I --> M[Device Management<br/>CRUD Operations]
    I --> N[Ticket System<br/>Support Management]
    I --> O[Analytics Engine<br/>Energy & Usage Reports]
    I --> P[Scheduling System<br/>Automated Controls]
    I --> Q[Notification System<br/>Email + In-app + Telegram]

    %% Data Storage
    L --> R[(MongoDB<br/>User Database)]
    M --> S[(MongoDB<br/>Device Database)]
    N --> T[(MongoDB<br/>Ticket Database)]
    O --> U[(MongoDB<br/>Analytics Database)]
    P --> V[(MongoDB<br/>Schedule Database)]
    Q --> W[(MongoDB<br/>Notification Database)]

    %% AI/ML Integration
    F --> X[Smart Scheduling<br/>Usage Pattern Analysis]
    F --> Y[Energy Forecasting<br/>Consumption Prediction]
    F --> Z[Anomaly Detection<br/>Usage Pattern Monitoring]

    %% Real-time Communication
    J --> AA[WebSocket Server<br/>Real-time Updates]
    AA --> B
    AA --> AB[Mobile App<br/>Real-time Sync]

    %% Data Flow Arrows
    R --> L
    S --> M
    T --> N
    U --> O
    V --> P
    W --> Q

    %% External Data Sources
    AC[(External APIs<br/>Weather, Time)] --> P
    AD[(Email Service<br/>SMTP)] --> Q
    AE[(SMS Service)] --> Q

    %% Monitoring & Logging
    AF[Prometheus<br/>Metrics Collection] --> AG[Grafana<br/>Dashboards]
    AH[Winston Logger] --> AI[(Log Files<br/>Error & Activity Logs)]

    %% Security Components
    AJ[JWT Authentication] --> L
    AK[Role-based Access Control] --> L
    AL[Input Validation] --> I
    AM[CORS Protection] --> I
    AN[Rate Limiting] --> I

    %% Process Flows
    AO[Device Registration] --> M
    AP[User Authentication] --> L
    AQ[Ticket Creation] --> N
    AR[Schedule Creation] --> P
    AS[Energy Monitoring] --> O
    AT[Notification Dispatch] --> Q

    %% Data Transformations
    AU[Raw Device Data] --> AV[Processed Analytics]
    AV --> AW[Reports & Dashboards]
    AX[Usage Patterns] --> AY[AI Predictions]
    AY --> AZ[Automated Schedules]

    %% Legend
    classDef external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef datastore fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef trustboundary fill:#fff3e0,stroke:#e65100,stroke-width:3px

    class A,C,E,G external
    class B,D,F,H,I,J,K,L,M,N,O,P,Q,X,Y,Z,AA,AF,AH,AJ,AK,AL,AM,AN,AO,AP,AQ,AR,AS,AT,AU,AV,AW,AX,AY,AZ process
    class R,S,T,U,V,W,AC,AD,AE,AG,AI datastore
    class AB trustboundary
```

## Data Flow Diagram Explanation

### Level 0 DFD - Context Diagram

**External Entities:**
- **Users**: Access system via web/mobile apps
- **ESP32 Devices**: IoT hardware sending sensor data via MQTT
- **AI/ML Service**: Python service for predictive analytics
- **Telegram Bot**: External messaging interface

**Main Process:**
- **AutoVolt System**: Central processing hub managing all IoT operations

**Data Stores:**
- **MongoDB**: Primary database for all system data
- **External Services**: Email, SMS, weather APIs

### Level 1 DFD - System Decomposition

**Key Processes:**

1. **Authentication Service**
   - JWT token generation/validation
   - Role-based access control
   - User session management

2. **Device Management**
   - Device registration/configuration
   - Real-time state monitoring
   - GPIO pin management

3. **Ticket System**
   - Support ticket creation/assignment
   - Status tracking and notifications
   - Comment and attachment management

4. **Analytics Engine**
   - Energy consumption tracking
   - Usage pattern analysis
   - Performance reporting

5. **Scheduling System**
   - Automated device control
   - Time-based operations
   - Holiday/schedule management

6. **Notification System**
   - Multi-channel notifications (email/in-app/Telegram)
   - Alert management
   - User preference handling

### Data Flows:

**Primary Data Flows:**
- User requests → Authentication → Authorization → Resource access
- Device telemetry → MQTT → Processing → Database storage
- Analytics data → AI/ML service → Predictions → Automated actions
- System events → Notification service → User alerts

**Real-time Data Flows:**
- WebSocket connections for live updates
- MQTT for device communication
- Push notifications for alerts

**Security Data Flows:**
- JWT tokens for API authentication
- Role-based permissions for access control
- Audit logs for compliance tracking

### Trust Boundaries:

- **External Interfaces**: Web/mobile apps, MQTT broker, Telegram API
- **Internal Processing**: Backend services, database operations
- **Security Controls**: Authentication, authorization, input validation

### Data Stores:

1. **User Database**: User profiles, permissions, authentication data
2. **Device Database**: Device configurations, sensor data, state logs
3. **Ticket Database**: Support tickets, comments, attachments
4. **Analytics Database**: Energy consumption, usage patterns, reports
5. **Schedule Database**: Automated schedules, execution logs
6. **Notification Database**: Alert history, delivery status

This DFD shows how data moves through the AutoVolt system from external sources through processing components to storage and back to users, highlighting the real-time IoT nature of the system and its comprehensive automation capabilities.