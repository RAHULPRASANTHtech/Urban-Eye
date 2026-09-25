import type {
  RealtimeEvent,
} from '../types';


export type WSMessage =
  RealtimeEvent;


// ============================================================
// REAL WEBSOCKET CONNECTION
// ============================================================

export function connectWebSocket(
  onMessage: (
    message: WSMessage
  ) => void
) {

  const url =
    import.meta.env.VITE_WS_URL;


  // Mock mode

  if (
    import.meta.env.VITE_USE_MOCKS !== 'false'
    || !url
  ) {

    return {

      close: () => {},

    };

  }


  const ws =
    new WebSocket(url);


  ws.onmessage =
    (event) => {

      try {

        const message =
          JSON.parse(
            event.data
          ) as WSMessage;


        onMessage(
          message
        );

      } catch {

        // Ignore malformed messages.

      }

    };


  return ws;

}


// ============================================================
// DEMO: INCIDENT CREATED
// ============================================================

export function simulateIncidentCreatedEvent(
  onMessage: (
    message: WSMessage
  ) => void
) {

  const timer =
    window.setTimeout(
      () => {

        onMessage({

          type:
            'incident_created',

          payload: {

            id:
              'INC-024',

            type:
              'POTHOLE',

            severity:
              'HIGH',

            verification_score:
              72,

            confirmed_buses:
              1,

            status:
              'UNDER_REVIEW',

            latitude:
              13.0582,

            longitude:
              80.2526,

            timestamp:
              new Date()
                .toISOString(),

            source_bus:
              'BUS-104',

            frames_validated:
              4,

            validation_total:
              4,

            description:
              'Deep road-surface defect detected and validated from recorded bus footage.',

          },

        });

      },
      1500
    );


  return () =>
    window.clearTimeout(
      timer
    );

}


// ============================================================
// DEMO: SECOND BUS CONFIRMATION
// ============================================================

export function simulateRealtimeEvent(
  onMessage: (
    message: WSMessage
  ) => void
) {

  const timer =
    window.setTimeout(
      () => {

        onMessage({

          type:
            'incident_confirmed',

          payload: {

            id:
              'INC-024',

            confirmed_buses:
              2,

            verification_score:
              94,

            status:
              'CONFIRMED',

            confirming_bus_id:
              'BUS-203',

          },

        });

      },
      3000
    );


  return () =>
    window.clearTimeout(
      timer
    );

}


// ============================================================
// DEMO: BUS LOCATION UPDATE
// ============================================================

export function simulateBusLocationEvent(
  onMessage: (
    message: WSMessage
  ) => void
) {

  const timer =
    window.setTimeout(
      () => {

        onMessage({

          type:
            'bus_location_updated',

          payload: {

            bus_id:
              'BUS-104',

            latitude:
              13.0621,

            longitude:
              80.2568,

            status:
              'ACTIVE',

            last_seen:
              'just now',

          },

        });

      },
      5000
    );


  return () =>
    window.clearTimeout(
      timer
    );

}


// ============================================================
// DEMO: INCIDENT UPDATED
// ============================================================

export function simulateIncidentUpdatedEvent(
  onMessage: (
    message: WSMessage
  ) => void
) {

  const timer =
    window.setTimeout(
      () => {

        onMessage({

          type:
            'incident_updated',

          payload: {

            id:
              'INC-024',

            severity:
              'HIGH',

            verification_score:
              96,

            status:
              'CONFIRMED',

          },

        });

      },
      7000
    );


  return () =>
    window.clearTimeout(
      timer
    );

}