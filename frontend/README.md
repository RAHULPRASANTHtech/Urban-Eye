# UrbanEye AI — Smart City Command Center

Frontend MVP for SIH 2026: React + TypeScript + Vite + Tailwind CSS + React Leaflet + Recharts + Axios.

## Run locally

1. Install Node.js 20+.
2. From this directory run `npm install`.
3. Run `npm run dev`.

The app is mock-first. Set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL` when the backend is ready. Set `VITE_WS_URL` for live WebSocket updates.

## Expected backend endpoints

- `GET /api/dashboard/summary`
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `GET /api/gis/incidents`
- `GET /api/gis/buses`
- WebSocket events: `incident_created`, `incident_updated`, `incident_confirmed`, `bus_location_updated`

## Demo concept

Live AI Monitoring includes a local simulator that moves an incident through DETECTED → VALIDATING → CONFIRMED → SENT so frontend work can continue before the backend is available.
