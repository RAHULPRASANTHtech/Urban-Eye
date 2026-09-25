import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type {
  ReactNode,
} from 'react';

import {
  connectWebSocket,
  simulateIncidentCreatedEvent,
  simulateRealtimeEvent,
  simulateBusLocationEvent,
  simulateIncidentUpdatedEvent,
} from '../services/websocket';

import {
  incidents as seedIncidents,
  buses as seedBuses,
  summary as seedSummary,
  activities as seedActivities,
} from '../mock/data';

import type {
  Activity,
  Bus,
  DashboardSummary,
  Incident,
  RealtimeEvent,
} from '../types';

import {
  getIncidents,
} from '../services/incidents';

import {
  getDashboardSummary,
} from '../services/dashboard';

import {
  getBuses,
} from '../services/gis';


// ============================================================
// CONTEXT TYPE
// ============================================================

type ContextValue = {

  incidents: Incident[];

  buses: Bus[];

  summary: DashboardSummary;

  activities: Activity[];

  loading: boolean;

  error: string | null;


  refreshData: () => Promise<void>;


  startBusDetection: (
    incidentId?: string
  ) => void;


  confirmBus: (
    incidentId: string,
    busId: string
  ) => void;


  updateBusLocation: (
    busId: string,
    latitude: number,
    longitude: number,
    lastSeen?: string
  ) => void;


  updateIncident: (
    incidentId: string,
    updates: Partial<Incident>
  ) => void;


  simulateIncident: (
    incidentId: string
  ) => void;


  resetDemo: () => void;

};


// ============================================================
// CONTEXT
// ============================================================

const C =
  createContext<ContextValue | null>(
    null
  );


// ============================================================
// PROVIDER
// ============================================================

export function UrbanEyeProvider({
  children,
}: {
  children: ReactNode;
}) {


  // =========================================================
  // STATE
  // =========================================================

  const [incidents, setIncidents] =
    useState<Incident[]>(
      []
    );


  const [buses, setBuses] =
    useState<Bus[]>(
      []
    );


  const [summary, setSummary] =
    useState<DashboardSummary>(
      seedSummary
    );


  const [activities, setActivities] =
    useState<Activity[]>(
      seedActivities
    );


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState<string | null>(
      null
    );


  // =========================================================
  // LOAD DATA FROM BACKEND
  // =========================================================

  const refreshData =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError(null);


          const [
            incidentsData,
            dashboardData,
            busesData,
          ] = await Promise.all([

            getIncidents(),

            getDashboardSummary(),

            getBuses(),

          ]);


          setIncidents(
            incidentsData
          );


          setSummary(
            dashboardData
          );


          setBuses(
            busesData
          );


        } catch (error) {

          console.error(
            'Failed to load UrbanEye data:',
            error
          );


          setError(
            'Failed to connect to UrbanEye backend.'
          );


          // Fallback to mock data

          if (
            import.meta.env
              .VITE_USE_MOCKS !== 'false'
          ) {

            setIncidents(
              seedIncidents
            );

            setBuses(
              seedBuses
            );

            setSummary(
              seedSummary
            );

          }


        } finally {

          setLoading(false);

        }

      },
      []
    );


  // =========================================================
  // INITIAL DATA LOAD
  // =========================================================

  useEffect(
    () => {

      refreshData();

    },
    [
      refreshData,
    ]
  );


  // =========================================================
  // ACTIVITY HELPER
  // =========================================================

  const addActivity =
    useCallback(
      (
        message: string,
        kind: Activity['kind']
      ) => {

        setActivities(
          (prev) => [

            {
              id:
                `a-${Date.now()}`,

              time:
                new Date()
                  .toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  ),

              message,

              kind,
            },

            ...prev,

          ].slice(0, 8)
        );

      },
      []
    );


  // =========================================================
  // REALTIME EVENT HANDLER
  // =========================================================

  const handleRealtimeEvent =
    useCallback(
      (
        event: RealtimeEvent
      ) => {

        switch (event.type) {


          // -------------------------------------------------
          // INCIDENT CREATED
          // -------------------------------------------------

          case 'incident_created': {

            setIncidents(
              (prev) => {

                const exists =
                  prev.some(
                    (incident) =>
                      incident.id === event.payload.id
                  );


                if (exists) {

                  return prev.map(
                    (incident) =>

                      incident.id === event.payload.id

                        ? {
                            ...incident,
                            ...event.payload,
                          }

                        : incident
                  );

                }


                return [

                  event.payload,

                  ...prev,

                ];

              }
            );


            addActivity(

              `${event.payload.id} detected by ${event.payload.source_bus}`,

              'detection'
            );


            break;

          }


          // -------------------------------------------------
          // INCIDENT CONFIRMED
          // -------------------------------------------------

          case 'incident_confirmed': {

            setIncidents(
              (prev) =>

                prev.map(
                  (incident) =>

                    incident.id === event.payload.id

                      ? {
                          ...incident,
                          ...event.payload,
                        }

                      : incident
                )
            );


            addActivity(

              `${event.payload.id} confirmed by multiple buses`,

              'confirmation'
            );


            break;

          }


          // -------------------------------------------------
          // INCIDENT UPDATED
          // -------------------------------------------------

          case 'incident_updated': {

            setIncidents(
              (prev) =>

                prev.map(
                  (incident) =>

                    incident.id === event.payload.id

                      ? {
                          ...incident,
                          ...event.payload,
                        }

                      : incident
                )
            );


            addActivity(

              `${event.payload.id} incident updated in realtime`,

              'system'
            );


            break;

          }


          // -------------------------------------------------
          // BUS LOCATION UPDATED
          // -------------------------------------------------

          case 'bus_location_updated': {

            setBuses(
              (prev) =>

                prev.map(
                  (bus) =>

                    bus.bus_id === event.payload.bus_id

                      ? {
                          ...bus,
                          ...event.payload,
                        }

                      : bus
                )
            );


            addActivity(

              `${event.payload.bus_id} GPS location updated`,

              'system'
            );


            break;

          }


          default:

            break;

        }

      },
      [
        addActivity,
      ]
    );


  // =========================================================
  // REALTIME CONNECTION
  // =========================================================

  useEffect(
    () => {

      const connection =
        connectWebSocket(
          handleRealtimeEvent
        );


      // Demo realtime simulations

      const cleanupIncidentCreated =
        simulateIncidentCreatedEvent(
          handleRealtimeEvent
        );


      const cleanupConfirmation =
        simulateRealtimeEvent(
          handleRealtimeEvent
        );


      const cleanupBusLocation =
        simulateBusLocationEvent(
          handleRealtimeEvent
        );


      const cleanupIncidentUpdated =
        simulateIncidentUpdatedEvent(
          handleRealtimeEvent
        );


      return () => {

        connection.close();


        cleanupIncidentCreated?.();

        cleanupConfirmation?.();

        cleanupBusLocation?.();

        cleanupIncidentUpdated?.();

      };

    },
    [
      handleRealtimeEvent,
    ]
  );


  // =========================================================
  // DEMO: START BUS DETECTION
  // =========================================================

  const startBusDetection =
    useCallback(
      (
        incidentId = 'INC-024'
      ) => {

        setIncidents(
          (prev) =>

            prev.map(
              (incident) =>

                incident.id === incidentId

                  ? {

                      ...incident,

                      confirmed_buses: 1,

                      verification_score: 72,

                      status:
                        'UNDER_REVIEW',

                    }

                  : incident
            )
        );


        addActivity(

          `BUS-104 sent ${incidentId} after multi-frame validation`,

          'validation'
        );

      },
      [
        addActivity,
      ]
    );


  // =========================================================
  // DEMO: CONFIRM BUS
  // =========================================================

  const confirmBus =
    useCallback(
      (
        incidentId: string,
        busId: string
      ) => {

        setIncidents(
          (prev) =>

            prev.map(
              (incident) =>

                incident.id === incidentId

                  ? {

                      ...incident,

                      confirmed_buses:
                        Math.max(
                          incident.confirmed_buses,
                          2
                        ),

                      verification_score:
                        Math.max(
                          incident.verification_score,
                          94
                        ),

                      status:
                        'CONFIRMED',

                    }

                  : incident
            )
        );


        addActivity(

          `${busId} confirmed ${incidentId}; verification increased`,

          'confirmation'
        );

      },
      [
        addActivity,
      ]
    );


  // =========================================================
  // UPDATE BUS LOCATION
  // =========================================================

  const updateBusLocation =
    useCallback(
      (
        busId: string,

        latitude: number,

        longitude: number,

        lastSeen = 'just now'
      ) => {

        setBuses(
          (prev) =>

            prev.map(
              (bus) =>

                bus.bus_id === busId

                  ? {

                      ...bus,

                      latitude,

                      longitude,

                      last_seen:
                        lastSeen,

                    }

                  : bus
            )
        );


        addActivity(

          `${busId} location updated`,

          'system'
        );

      },
      [
        addActivity,
      ]
    );


  // =========================================================
  // UPDATE INCIDENT LOCALLY
  // =========================================================

  const updateIncident =
    useCallback(
      (
        incidentId: string,

        updates:
          Partial<Incident>
      ) => {

        setIncidents(
          (prev) =>

            prev.map(
              (incident) =>

                incident.id === incidentId

                  ? {

                      ...incident,

                      ...updates,

                    }

                  : incident
            )
        );


        addActivity(

          `${incidentId} incident record updated`,

          'system'
        );

      },
      [
        addActivity,
      ]
    );


  // =========================================================
  // DEMO SIMULATION
  // =========================================================

  const simulateIncident =
    useCallback(
      (
        incidentId: string
      ) => {

        confirmBus(
          incidentId,
          'BUS-203'
        );

      },
      [
        confirmBus,
      ]
    );


  // =========================================================
  // RESET DEMO
  // =========================================================

  const resetDemo =
    useCallback(
      () => {

        setActivities(
          seedActivities
        );


        refreshData();

      },
      [
        refreshData,
      ]
    );


  // =========================================================
  // PROVIDER
  // =========================================================

  return (

    <C.Provider
      value={{

        incidents,

        buses,

        summary,

        activities,

        loading,

        error,

        refreshData,

        startBusDetection,

        confirmBus,

        updateBusLocation,

        updateIncident,

        simulateIncident,

        resetDemo,

      }}
    >

      {children}

    </C.Provider>

  );

}


// ============================================================
// CONTEXT HOOK
// ============================================================

export function useUrbanEye() {

  const context =
    useContext(C);


  if (!context) {

    throw new Error(

      'useUrbanEye must be used inside UrbanEyeProvider'

    );

  }


  return context;

}