import { api } from './api';
import { incidents } from '../mock/data';
import type { Incident } from '../types';


function normalizeIncident(
  incident: any
): Incident {

  return {

    id: incident.id,

    incident_id:
      incident.incident_id,

    type:
      String(
        incident.type
      ).toUpperCase() as Incident['type'],

    severity:
      String(
        incident.severity
      ).toUpperCase() as Incident['severity'],

    verification_score:
      Number(
        incident.verification_score
      ),

    confirmed_buses:
      Number(
        incident.confirmed_buses
      ),

    status:
      String(
        incident.status
      ).toUpperCase() as Incident['status'],

    latitude:
      Number(
        incident.latitude
      ),

    longitude:
      Number(
        incident.longitude
      ),

    timestamp:
      incident.timestamp,

    evidence_image:
      incident.evidence_image,

    source_bus:
      incident.source_bus,

    frames_validated:
      Number(
        incident.frames_validated
      ),

    validation_total:
      Number(
        incident.validation_total
      ),

    description:
      incident.description,

  };

}


export async function getIncidents() {

  if (
    import.meta.env
      .VITE_USE_MOCKS !== 'false'
  ) {

    return Promise.resolve(
      incidents
    );

  }


  const { data } =
    await api.get(
      '/api/incidents'
    );


  return data.map(
    normalizeIncident
  );

}


export async function getIncident(
  id: string | number
) {

  if (
    import.meta.env
      .VITE_USE_MOCKS !== 'false'
  ) {

    return Promise.resolve(

      incidents.find(

        (incident) =>

          incident.id === id ||

          incident.incident_id ===
            Number(id)

      ) ?? incidents[0]

    );

  }


  const incidentId =

    typeof id === 'string'

      ? (
          id
            .replace('INC-', '')
            .replace(/^0+/, '')

          || '0'
        )

      : String(id);


  const { data } =
    await api.get(

      `/api/incidents/${incidentId}`

    );


  return normalizeIncident(
    data
  );

}