// ============================================================
// COMMON TYPES
// ============================================================

export type Severity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';


// ============================================================
// INCIDENT STATUS
// ============================================================

export type IncidentStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'RESOLVED';


// ============================================================
// INCIDENT TYPE
// ============================================================

export type IncidentType = string;


// ============================================================
// INCIDENT
// ============================================================

export interface Incident {

  id: string;

  incident_id?: number;

  type: IncidentType;

  severity: Severity;

  verification_score: number;

  confirmed_buses: number;

  status: IncidentStatus;

  latitude: number;

  longitude: number;

  timestamp: string;

  evidence_image?: string;

  source_bus: string;

  frames_validated: number;

  validation_total: number;

  description: string;

}


// ============================================================
// BUS
// ============================================================

export interface Bus {

  bus_id: string;

  latitude: number;

  longitude: number;

  status:
    | 'ACTIVE'
    | 'IDLE'
    | 'OFFLINE';

  last_seen: string;

  recent_events: number;

  route: string;

}


// ============================================================
// ACTIVITY
// ============================================================

export interface Activity {

  id: string;

  time: string;

  message: string;

  kind:
    | 'detection'
    | 'validation'
    | 'confirmation'
    | 'system';

}


// ============================================================
// DASHBOARD SUMMARY
// ============================================================

export interface DashboardSummary {

  total_incidents: number;

  active_incidents: number;

  critical_incidents: number;

  potholes: number;

  active_buses: number;

}


// ============================================================
// REALTIME EVENTS
// ============================================================


// ------------------------------------------------------------
// INCIDENT CREATED
// ------------------------------------------------------------

export interface IncidentCreatedEvent {

  type: 'incident_created';

  payload: Incident;

}


// ------------------------------------------------------------
// INCIDENT CONFIRMED
// ------------------------------------------------------------

export interface IncidentConfirmedEvent {

  type: 'incident_confirmed';

  payload: {

    id: string;

    confirmed_buses: number;

    verification_score: number;

    status: IncidentStatus;

    confirming_bus_id?: string;

  };

}


// ------------------------------------------------------------
// INCIDENT UPDATED
// ------------------------------------------------------------

export interface IncidentUpdatedEvent {

  type: 'incident_updated';

  payload: {

    id: string;

    severity?: Severity;

    verification_score?: number;

    confirmed_buses?: number;

    status?: IncidentStatus;

    description?: string;

  };

}


// ------------------------------------------------------------
// BUS LOCATION UPDATED
// ------------------------------------------------------------

export interface BusLocationUpdatedEvent {

  type: 'bus_location_updated';

  payload: {

    bus_id: string;

    latitude: number;

    longitude: number;

    status?: Bus['status'];

    last_seen?: string;

  };

}


// ============================================================
// REALTIME EVENT UNION
// ============================================================

export type RealtimeEvent =

  | IncidentCreatedEvent

  | IncidentConfirmedEvent

  | IncidentUpdatedEvent

  | BusLocationUpdatedEvent;