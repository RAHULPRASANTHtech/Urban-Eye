import { useEffect } from 'react';

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';

import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import GISMap from './pages/GISMap';
import Incidents from './pages/Incidents';
import IncidentDetails from './pages/IncidentDetails';
import Fleet from './pages/Fleet';
import Analytics from './pages/Analytics';

import {
  UrbanEyeProvider,
  useUrbanEye,
} from './store/UrbanEyeContext';

import {
  simulateBusLocationEvent,
  simulateIncidentUpdatedEvent,
  simulateRealtimeEvent,
} from './services/websocket';

function RealtimeBridge() {
  const {
    confirmBus,
    updateBusLocation,
    updateIncident,
  } = useUrbanEye();

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCKS !== 'true') {
      return;
    }

    // Simulate incident confirmation from a second bus.
    const cleanup = simulateRealtimeEvent((message) => {
      if (message.type === 'incident_confirmed') {
        const payload = message.payload;

        if (payload.id) {
          confirmBus(
            payload.id,
            payload.confirming_bus_id ?? 'BUS-203'
          );
        }
      }
    });

    // Simulate live bus movement.
    const cleanupBusLocation = simulateBusLocationEvent(
      (message) => {
        if (message.type === 'bus_location_updated') {
          const payload = message.payload;

          if (
            payload.bus_id &&
            payload.latitude !== undefined &&
            payload.longitude !== undefined
          ) {
            updateBusLocation(
              payload.bus_id,
              payload.latitude,
              payload.longitude,
              payload.last_seen
            );
          }
        }
      }
    );

    // Simulate a later incident update.
    const cleanupIncidentUpdate =
      simulateIncidentUpdatedEvent((message) => {
        if (message.type === 'incident_updated') {
          const payload = message.payload;

          if (payload.id) {
            updateIncident(payload.id, {
              ...(payload.severity && {
                severity: payload.severity,
              }),
              ...(payload.verification_score !== undefined && {
                verification_score:
                  payload.verification_score,
              }),
              ...(payload.status && {
                status: payload.status,
              }),
            });
          }
        }
      });

    return () => {
      cleanup();
      cleanupBusLocation();
      cleanupIncidentUpdate();
    };
  }, [confirmBus, updateBusLocation, updateIncident]);

  return null;
}

export default function App() {
  return (
    <UrbanEyeProvider>
      <RealtimeBridge />

      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/monitoring"
              element={<Monitoring />}
            />

            <Route
              path="/map"
              element={<GISMap />}
            />

            <Route
              path="/incidents"
              element={<Incidents />}
            />

            <Route
              path="/incidents/:id"
              element={<IncidentDetails />}
            />

            <Route
              path="/fleet"
              element={<Fleet />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </UrbanEyeProvider>
  );
}