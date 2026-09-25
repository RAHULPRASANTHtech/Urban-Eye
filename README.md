# UrbanEye AI Command Center

> AI-powered urban road intelligence and real-time incident monitoring platform.

UrbanEye is an AI-driven command center designed to help cities monitor road conditions, detect incidents, verify events using multiple sources, and visualize urban intelligence in real time.

The platform combines computer vision, geospatial processing, multi-source incident verification, real-time communication, and an interactive web dashboard into a unified system.

---

## 🚨 Problem

Modern cities generate large amounts of information from buses, cameras, road-monitoring systems, and other urban infrastructure.

However, detecting and responding to road incidents can be difficult because:

- Road damage can go unnoticed for long periods.
- A single AI detection may produce false positives.
- Traffic accidents require rapid verification.
- Incident information can be distributed across different systems.
- Operators need a real-time geographical view of incidents.
- Historical incident information is useful for analysis and decision-making.

UrbanEye addresses these challenges by creating a centralized AI-powered urban intelligence platform.

---

# 🎯 Objectives

UrbanEye is designed to:

- Detect road and traffic-related incidents using computer vision.
- Process AI-generated events from multiple sources.
- Reduce false positives through multi-bus incident confirmation.
- Track incidents geographically using latitude and longitude.
- Calculate incident verification scores.
- Classify incidents according to severity.
- Provide real-time incident updates through WebSockets.
- Display incidents and buses on an interactive GIS interface.
- Maintain incident status and status-history information.
- Provide dashboard metrics for city operators.
- Integrate AI detection services with a centralized backend.

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────────┐
                    │      Urban Data Sources  │
                    │                          │
                    │  Bus Cameras / AI Models │
                    │  Road Monitoring Systems │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     AI Detection Layer   │
                    │                          │
                    │ YOLO-based Detection     │
                    │ Road / Accident Models   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      FastAPI Backend     │
                    │                          │
                    │ Event Processing         │
                    │ Incident Management      │
                    │ Verification Engine      │
                    │ Severity Calculation     │
                    │ WebSocket Communication  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
                    ▼                          ▼
          ┌──────────────────┐       ┌──────────────────┐
          │ PostgreSQL       │       │ WebSocket        │
          │ + PostGIS        │       │ Real-time Layer  │
          │                  │       │                  │
          │ Events           │       │ Live Updates     │
          │ Incidents        │       │ Incident Alerts  │
          │ Buses            │       └────────┬─────────┘
          │ Confirmations    │                │
          │ Status History   │                │
          └────────┬─────────┘                │
                   │                          │
                   └────────────┬─────────────┘
                                ▼
                    ┌──────────────────────────┐
                    │ React + TypeScript       │
                    │ UrbanEye Dashboard       │
                    │                          │
                    │ Dashboard                │
                    │ Incidents                │
                    │ GIS Map                  │
                    │ Monitoring               │
                    │ Fleet                    │
                    │ Analytics                │
                    └──────────────────────────┘
````

---

# 🧩 Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React-based component architecture
* WebSocket client
* GIS / GeoJSON visualization
* Browser geolocation and camera integration

## Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* PostGIS
* WebSockets
* Pydantic

## AI / Computer Vision

* YOLO-based object detection
* Road damage detection
* Pothole detection
* Accident detection
* Custom trained model weights

## Infrastructure

* Docker
* PostgreSQL + PostGIS
* Git
* Git LFS

---

# 🤖 AI Detection

UrbanEye integrates computer vision models for detecting road and traffic-related events.

The backend contains trained model weights for:

### Road Damage Detection

The road detection pipeline includes classes such as:

* Longitudinal Crack
* Transverse Crack
* Alligator Crack
* Pothole
* Other

### Accident Detection

UrbanEye also contains an accident detection model used by the accident detection service.

The AI detection layer can generate structured events containing information such as:

```json
{
  "event_id": "EVT-001",
  "bus_id": "BUS-101",
  "event_type": "pothole",
  "latitude": 12.9716,
  "longitude": 80.2209,
  "confidence": 0.91,
  "evidence_url": "..."
}
```

These events are then processed by the backend incident-management pipeline.

---

# 🧠 Multi-Source Incident Verification

One of the core concepts of UrbanEye is that a single AI detection does not necessarily need to become a confirmed incident immediately.

When an AI event arrives, the backend checks for an existing unresolved incident of the same event type within a defined geographical radius.

UrbanEye currently uses a **20-meter spatial matching radius** for this process.

```text
Bus A ────────┐
              │
              ▼
        AI Detection
              │
              ▼
       Spatial Matching
              │
       ┌──────┴──────┐
       │             │
 Existing         New
 Incident        Incident
       │             │
       ▼             ▼
   Confirm        Create
   Incident      Incident
```

This allows detections from multiple buses to contribute to the same real-world incident.

---

# 📊 Verification Score

UrbanEye calculates a verification score using multiple signals:

```text
Verification Score

        AI Confidence       → 50%
        Unique Buses        → 30%
        Confirmation Count  → 20%
```

Conceptually:

```text
Verification Score =
    AI Confidence Contribution
    +
    Unique Bus Contribution
    +
    Confirmation Contribution
```

This provides a more structured representation of incident confidence than relying on a single detection.

---

# 🚦 Incident Severity

UrbanEye calculates incident severity based on verification information and detection confidence.

The current backend severity logic includes:

| Condition                                 | Severity |
| ----------------------------------------- | -------- |
| Highly verified event with multiple buses | CRITICAL |
| High verification score                   | HIGH     |
| Higher-confidence detection               | MEDIUM   |
| Lower-confidence detection                | LOW      |

Severity is stored with incidents and exposed through the API and frontend.

---

# 🔄 Incident Lifecycle

UrbanEye maintains an incident lifecycle that allows operators to track the state of an incident.

Supported statuses include:

```text
NEW
  │
  ▼
UNDER_REVIEW
  │
  ▼
CONFIRMED
  │
  ▼
IN_PROGRESS
  │
  ▼
RESOLVED
```

The system also maintains status history so that changes can be tracked over time.

---

# 🌐 Real-Time Communication

UrbanEye uses WebSockets for real-time communication between the backend and frontend.

WebSocket endpoint:

```text
/ws
```

The backend can broadcast events such as:

```text
incident_created
incident_confirmed
incident_updated
```

This allows the command center dashboard to receive incident updates without continuously refreshing the page.

---

# 🗺️ GIS & Spatial Intelligence

UrbanEye uses PostgreSQL with PostGIS for geographical data processing.

The system stores geographical coordinates for:

* Incidents
* Buses
* AI events

Spatial operations are used to determine whether detections are geographically close enough to belong to the same incident.

The backend also provides GeoJSON-based GIS data for frontend visualization.

---

# 🚌 Fleet Monitoring

UrbanEye tracks buses that act as mobile urban sensing platforms.

Bus information includes:

* Bus ID
* Latitude
* Longitude
* Last seen timestamp
* Active/inactive state

This allows the command center to understand where active sensing sources are operating.

---

# 📡 Backend API

The FastAPI backend provides APIs for:

```text
/api/events
/api/incidents
/api/dashboard
/api/gis
/ws
```

The backend also provides database connectivity testing through:

```text
/api/test-db
```

API documentation is automatically available through FastAPI when the backend is running:

```text
/docs
```

---

# 🖥️ Frontend Dashboard

The React frontend contains multiple command-center views.

### Dashboard

Provides an overview of the current urban situation.

### Incidents

Displays detected incidents and their status.

### Incident Details

Provides detailed information about an individual incident.

### GIS Map

Displays incidents and buses geographically.

### Fleet

Provides information about monitored buses.

### Monitoring

Provides real-time monitoring functionality.

### Analytics

Provides analytical views of urban events and incident information.

---

# 📁 Project Structure

```text
Urban-Eye/
│
├── backend/
│   │
│   ├── ai_models/
│   │   ├── accident_model/
│   │   │   └── epoch14.pt
│   │   ├── best.pt
│   │   └── pothole_best.pt
│   │
│   ├── routers/
│   │   ├── accident_detection.py
│   │   ├── ai_detection.py
│   │   ├── ai_events.py
│   │   ├── dashboard.py
│   │   ├── events.py
│   │   ├── gis.py
│   │   ├── incidents.py
│   │   └── websocket.py
│   │
│   ├── services/
│   │   ├── accident_detection_service.py
│   │   ├── detection_service.py
│   │   ├── incident_manager.py
│   │   └── spatial_tracker.py
│   │
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
│
├── frontend/
│   │
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── mock/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── .gitignore
└── .gitattributes
```

---

# ⚙️ Local Development

## 1. Clone the repository

```bash
git clone https://github.com/RAHULPRASANTHtech/Urban-Eye.git
cd Urban-Eye
```

Because the repository uses Git LFS for model weights:

```bash
git lfs install
git lfs pull
```

---

# 🗄️ Database Setup

UrbanEye uses PostgreSQL with PostGIS.

Example database configuration:

```env
DATABASE_URL=postgresql://urban_user:urban_password@localhost:5432/urban_intelligence
```

The actual `.env` file should **never be committed**.

Use the provided `.env.example` files as templates.

---

# 🐍 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

Do not commit secrets or local credentials.

Backend:

```text
backend/.env
```

Frontend:

```text
frontend/.env
```

Use:

```text
.env.example
```

as the template for required environment variables.

---

# 🧪 Testing

The backend contains test and debugging utilities for:

* AI model testing
* Detection service testing
* Accident detection
* Pothole model testing
* WebSocket testing
* Video processing
* Model class inspection

Example:

```bash
python test_ai.py
```

or:

```bash
python test_detection_service.py
```

---

# 📦 Git LFS

Large YOLO model files are stored using Git Large File Storage.

Tracked model files include:

```text
backend/ai_models/best.pt
backend/ai_models/pothole_best.pt
backend/ai_models/accident_model/epoch14.pt
```

After cloning the repository, run:

```bash
git lfs install
git lfs pull
```

---

# 🔒 Security

The following files should not be committed:

```text
.env
node_modules/
dist/
Python virtual environments
local credentials
API keys
database passwords
```

The repository's `.gitignore` files are configured to exclude sensitive and generated files.

---

# 🚀 Core Workflow

The main UrbanEye workflow can be summarized as:

```text
AI Detection
     │
     ▼
AI Event Generated
     │
     ▼
FastAPI Event API
     │
     ▼
Duplicate Event Check
     │
     ▼
20m Spatial Incident Matching
     │
     ├───────────────┐
     │               │
     ▼               ▼
Existing Incident   New Incident
     │               │
     ▼               ▼
Add Confirmation    Create Incident
     │               │
     └───────┬───────┘
             ▼
    Verification Score
             │
             ▼
       Severity Logic
             │
             ▼
      PostgreSQL/PostGIS
             │
             ▼
       WebSocket Event
             │
             ▼
      React Dashboard
             │
             ▼
      Operator Response
```

---

# 🌍 Vision

UrbanEye aims to provide a unified technological foundation for intelligent urban monitoring by connecting:

```text
Computer Vision
       +
Geospatial Intelligence
       +
Real-Time Communication
       +
Multi-Source Verification
       +
Urban Analytics
```

into a single command-center platform.

---

# 👥 Project

**UrbanEye AI Command Center**

Built using modern web technologies, AI-based computer vision, spatial databases, and real-time communication systems.

---
