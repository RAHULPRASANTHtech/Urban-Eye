import {
  useEffect,
} from 'react';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import type {
  Bus,
  Incident,
} from '../../types';


// ============================================================
// MAP AUTO-FIT COMPONENT
// ============================================================

function FitMapToData({
  incidents,
  buses,
}: {
  incidents: Incident[];
  buses: Bus[];
}) {

  const map = useMap();


  useEffect(
    () => {

      const points: [number, number][] = [];


      incidents.forEach(
        (incident) => {

          const latitude =
            Number(incident.latitude);

          const longitude =
            Number(incident.longitude);


          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {

            points.push([
              latitude,
              longitude,
            ]);

          }

        }
      );


      buses.forEach(
        (bus) => {

          const latitude =
            Number(bus.latitude);

          const longitude =
            Number(bus.longitude);


          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {

            points.push([
              latitude,
              longitude,
            ]);

          }

        }
      );


      if (points.length === 0) {

        return;

      }


      // One point only
      if (points.length === 1) {

        map.setView(
          points[0],
          14
        );

        return;

      }


      map.fitBounds(
        points,
        {
          padding: [40, 40],
          maxZoom: 15,
        }
      );

    },
    [
      map,
      incidents,
      buses,
    ]
  );


  return null;

}


// ============================================================
// INCIDENT MARKER STYLE
// ============================================================

function getIncidentMarkerStyle(
  severity: Incident['severity']
) {

  switch (severity) {

    case 'CRITICAL':

      return {
        color: '#fb7185',
        fillColor: '#fb7185',
        radius: 11,
      };


    case 'HIGH':

      return {
        color: '#fb923c',
        fillColor: '#fb923c',
        radius: 9,
      };


    case 'MEDIUM':

      return {
        color: '#facc15',
        fillColor: '#facc15',
        radius: 8,
      };


    case 'LOW':

      return {
        color: '#5eead4',
        fillColor: '#5eead4',
        radius: 7,
      };


    default:

      return {
        color: '#5eead4',
        fillColor: '#5eead4',
        radius: 7,
      };

  }

}


// ============================================================
// MAIN MAP COMPONENT
// ============================================================

export default function MapView({
  incidents,
  buses,
}: {
  incidents: Incident[];
  buses: Bus[];
}) {


  // =========================================================
  // VALIDATE INCIDENT COORDINATES
  // =========================================================

  const validIncidents =
    incidents.filter(
      (incident) => {

        const latitude =
          Number(incident.latitude);

        const longitude =
          Number(incident.longitude);


        return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );

      }
    );


  // =========================================================
  // VALIDATE BUS COORDINATES
  // =========================================================

  const validBuses =
    buses.filter(
      (bus) => {

        const latitude =
          Number(bus.latitude);

        const longitude =
          Number(bus.longitude);


        return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );

      }
    );


  // =========================================================
  // DEFAULT MAP CENTER
  // =========================================================

  const defaultCenter:
    [number, number] =
    [13.0827, 80.2707];


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-800">

      <MapContainer

        center={defaultCenter}

        zoom={12}

        scrollWheelZoom={true}

        className="h-full w-full"

      >


        {/* OPENSTREETMAP */}

        <TileLayer

          attribution="&copy; OpenStreetMap contributors"

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />


        {/* AUTO-FIT MAP */}

        <FitMapToData

          incidents={validIncidents}

          buses={validBuses}

        />


        {/* INCIDENT MARKERS */}

        {validIncidents.map(
          (incident) => {

            const markerStyle =
              getIncidentMarkerStyle(
                incident.severity
              );


            return (

              <CircleMarker

                key={incident.id}

                center={[
                  Number(incident.latitude),
                  Number(incident.longitude),
                ]}

                radius={
                  markerStyle.radius
                }

                pathOptions={{

                  color:
                    markerStyle.color,

                  fillColor:
                    markerStyle.fillColor,

                  fillOpacity:
                    0.85,

                  weight:
                    2,

                }}

              >


                {/* TOOLTIP */}

                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                >

                  <strong>

                    {incident.id}

                  </strong>

                </Tooltip>


                {/* POPUP */}

                <Popup>

                  <div
                    style={{
                      minWidth: 200,
                      color: '#0f172a',
                    }}
                  >

                    <strong>

                      {incident.id}

                      {' · '}

                      {incident.type
                        .replaceAll('_', ' ')
                        .replace(/\b\w/g, (char) =>
                          char.toUpperCase()
                        )}

                    </strong>


                    <div
                      style={{
                        marginTop: 8,
                      }}
                    >

                      Severity:

                      {' '}

                      {incident.severity}

                    </div>


                    <div>

                      Verification:

                      {' '}

                      {incident.verification_score}%

                    </div>


                    <div>

                      Confirmed:

                      {' '}

                      {incident.confirmed_buses}

                      {' buses'}

                    </div>


                    <div>

                      Status:

                      {' '}

                      {incident.status
                        .replaceAll('_', ' ')}

                    </div>


                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        color: '#64748b',
                      }}
                    >

                      {Number(
                        incident.latitude
                      ).toFixed(5)}

                      {', '}

                      {Number(
                        incident.longitude
                      ).toFixed(5)}

                    </div>

                  </div>

                </Popup>


              </CircleMarker>

            );

          }
        )}


        {/* BUS MARKERS */}

        {validBuses.map(
          (bus) => (

            <CircleMarker

              key={bus.bus_id}

              center={[
                Number(bus.latitude),
                Number(bus.longitude),
              ]}

              radius={6}

              pathOptions={{

                color:
                  '#60a5fa',

                fillColor:
                  '#60a5fa',

                fillOpacity:
                  0.9,

                weight:
                  2,

              }}

            >


              {/* TOOLTIP */}

              <Tooltip
                direction="top"
                offset={[0, -8]}
              >

                <strong>

                  {bus.bus_id}

                </strong>

              </Tooltip>


              {/* POPUP */}

              <Popup>

                <div
                  style={{
                    minWidth: 180,
                    color: '#0f172a',
                  }}
                >

                  <strong>

                    {bus.bus_id}

                  </strong>


                  <div
                    style={{
                      marginTop: 8,
                    }}
                  >

                    Route:

                    {' '}

                    {bus.route ||
                      'Unavailable'}

                  </div>


                  <div>

                    Status:

                    {' '}

                    {bus.status}

                  </div>


                  <div>

                    Last seen:

                    {' '}

                    {bus.last_seen}

                  </div>


                  <div>

                    Recent events:

                    {' '}

                    {bus.recent_events}

                  </div>


                </div>

              </Popup>


            </CircleMarker>

          )
        )}


      </MapContainer>

    </div>

  );

}