import { api } from './api';


export interface CreateAIEventPayload {

  event_type: string;

  severity: string;

  latitude: number;

  longitude: number;

  confidence: number;

  bus_id?: string;

  evidence_url?: string;

}


export interface AIEventResponse {

  message: string;

  event_id: string;

  incident_id?: number | null;

}


export async function createAIEvent(
  payload: CreateAIEventPayload
): Promise<AIEventResponse> {

  const { data } =
    await api.post(
      '/api/ai-events',
      {
        event_type:
          payload.event_type,

        severity:
          payload.severity,

        latitude:
          payload.latitude,

        longitude:
          payload.longitude,

        confidence:
          payload.confidence,

        bus_id:
          payload.bus_id ??
          'DEMO-CAMERA-001',

        evidence_url:
          payload.evidence_url ??
          null,
      }
    );


  return data;

}