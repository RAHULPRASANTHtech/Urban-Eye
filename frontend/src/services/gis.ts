import { api } from './api';

import {
  buses,
  incidents,
} from '../mock/data';

import type {
  Bus,
  Incident,
} from '../types';


interface GeoJSONFeature {
  type: 'Feature';

  geometry: {
    type: 'Point';

    coordinates: [
      number,
      number
    ];
  };

  properties: Record<
    string,
    any
  >;
}


interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';

  features: GeoJSONFeature[];
}


// ============================================================
// GIS INCIDENTS
// ============================================================

export async function getGISIncidents():
  Promise<Incident[]> {

  if (
    import.meta.env
      .VITE_USE_MOCKS !== 'false'
  ) {

    return Promise.resolve(
      incidents
    );

  }


  const { data } =
    await api.get<GeoJSONFeatureCollection>(
      '/api/gis/incidents'
    );


  return data.features.map(
    (feature) => {

      const properties =
        feature.properties;


      // GeoJSON format:
      // coordinates[0] = longitude
      // coordinates[1] = latitude

      const [
        longitude,
        latitude,
      ] =
        feature.geometry.coordinates;


      return {

        id:
          `INC-${String(
            properties.id
          ).padStart(
            3,
            '0'
          )}`,

        incident_id:
          properties.id,

        type:
          properties.event_type,

        severity:
          properties.severity,

        verification_score:
          (
            properties.verification_score ??
            properties.average_confidence ??
            0
          ) * 100,

        confirmed_buses:
          properties.unique_bus_count ??
          properties.confirmation_count ??
          0,

        status:
          properties.status,

        latitude,

        longitude,

        timestamp:
          properties.created_at,

        source_bus:
          properties.source_bus ??
          'UNKNOWN',

        frames_validated:
          properties.confirmation_count ??
          0,

        validation_total:
          4,

        description:
          `${String(
            properties.event_type ?? 'incident'
          )
            .replace(/_/g, ' ')
            .replace(
              /\b\w/g,
              (char: string) =>
                char.toUpperCase()
            )} detected by UrbanEye AI`,

      };

    }
  );

}


// ============================================================
// GIS BUSES
// ============================================================

export async function getBuses():
  Promise<Bus[]> {

  if (
    import.meta.env
      .VITE_USE_MOCKS !== 'false'
  ) {

    return Promise.resolve(
      buses
    );

  }


  const { data } =
    await api.get<GeoJSONFeatureCollection>(
      '/api/gis/buses'
    );


  return data.features.map(
    (feature) => {

      const properties =
        feature.properties;


      // GeoJSON format:
      // coordinates[0] = longitude
      // coordinates[1] = latitude

      const [
        longitude,
        latitude,
      ] =
        feature.geometry.coordinates;


      return {

        bus_id:
          properties.bus_id,

        latitude,

        longitude,

        status:
          properties.is_active
            ? 'ACTIVE'
            : 'OFFLINE',

        last_seen:
          properties.last_seen,

        recent_events:
          0,

        route:
          'Urban sensing route',

      };

    }
  );

}