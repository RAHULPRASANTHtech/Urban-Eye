import {
  useMemo,
  useState,
} from 'react';

import MapView from '../components/map/MapView';

import Panel from '../components/ui/Panel';

import {
  useUrbanEye,
} from '../store/UrbanEyeContext';


export default function GISMap() {


  const {
    incidents,
    buses,
    loading,
  } = useUrbanEye();


  // =========================================================
  // FILTER STATE
  // =========================================================

  const [type, setType] =
    useState('ALL');


  const [severity, setSeverity] =
    useState('ALL');


  const [status, setStatus] =
    useState('ALL');


  // =========================================================
  // AVAILABLE INCIDENT TYPES
  // =========================================================

  const incidentTypes =
    useMemo(
      () => {

        return [
          ...new Set(
            incidents.map(
              (incident) =>
                incident.type
            )
          ),
        ];

      },
      [incidents]
    );


  // =========================================================
  // FILTER INCIDENTS
  // =========================================================

  const filteredIncidents =
    useMemo(
      () => {

        return incidents.filter(
          (incident) => {

            const matchesType =
              type === 'ALL' ||
              incident.type === type;


            const matchesSeverity =
              severity === 'ALL' ||
              incident.severity === severity;


            const matchesStatus =
              status === 'ALL' ||
              incident.status === status;


            return (
              matchesType &&
              matchesSeverity &&
              matchesStatus
            );

          }
        );

      },
      [
        incidents,
        type,
        severity,
        status,
      ]
    );


  // =========================================================
  // BUS COUNTS
  // =========================================================

  const activeBuses =
    buses.filter(
      (bus) =>
        bus.status === 'ACTIVE'
    );


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="space-y-6">


      {/* HEADER */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">

          Spatial intelligence

        </p>


        <h1 className="mt-2 text-2xl font-semibold text-white">

          GIS Map

        </h1>


        <p className="mt-2 text-sm text-slate-400">

          Incidents and active buses visualized as a distributed sensing network.

        </p>

      </div>


      {/* MAIN GRID */}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">


        {/* MAP */}

        <Panel
          title="Live city map"
          subtitle={
            loading
              ? 'Loading spatial data...'
              : `${filteredIncidents.length} incidents · ${activeBuses.length} active buses`
          }
        >

          {loading ? (

            <div className="flex h-[520px] items-center justify-center text-sm text-slate-500">

              Loading map data...

            </div>

          ) : (

            <MapView
              incidents={filteredIncidents}
              buses={buses}
            />

          )}

        </Panel>


        {/* FILTER PANEL */}

        <Panel
          title="Map filters"
          subtitle="Focus the spatial view"
        >


          <div className="space-y-4">


            {/* INCIDENT TYPE */}

            <label className="block text-xs text-slate-400">

              Incident type


              <select

                value={type}

                onChange={(event) =>
                  setType(
                    event.target.value
                  )
                }

                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/50
                  px-3
                  py-2.5
                  text-xs
                  text-slate-200
                  outline-none
                  focus:border-teal-400/40
                "
              >

                <option value="ALL">

                  ALL

                </option>


                {incidentTypes.map(
                  (incidentType) => (

                    <option
                      key={incidentType}
                      value={incidentType}
                    >

                      {incidentType}

                    </option>

                  )
                )}

              </select>

            </label>


            {/* SEVERITY */}

            <label className="block text-xs text-slate-400">

              Severity


              <select

                value={severity}

                onChange={(event) =>
                  setSeverity(
                    event.target.value
                  )
                }

                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/50
                  px-3
                  py-2.5
                  text-xs
                  text-slate-200
                  outline-none
                  focus:border-teal-400/40
                "
              >

                <option value="ALL">

                  ALL

                </option>

                <option value="CRITICAL">

                  CRITICAL

                </option>

                <option value="HIGH">

                  HIGH

                </option>

                <option value="MEDIUM">

                  MEDIUM

                </option>

                <option value="LOW">

                  LOW

                </option>

              </select>

            </label>


            {/* STATUS */}

            <label className="block text-xs text-slate-400">

              Status


              <select

                value={status}

                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }

                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/50
                  px-3
                  py-2.5
                  text-xs
                  text-slate-200
                  outline-none
                  focus:border-teal-400/40
                "
              >

                <option value="ALL">

                  ALL

                </option>

                <option value="NEW">

                  NEW

                </option>

                <option value="UNDER_REVIEW">

                  UNDER REVIEW

                </option>

                <option value="CONFIRMED">

                  CONFIRMED

                </option>

                <option value="IN_PROGRESS">

                  IN PROGRESS

                </option>

                <option value="RESOLVED">

                  RESOLVED

                </option>

              </select>

            </label>


          </div>


          {/* RESET FILTERS */}

          <button

            onClick={() => {

              setType('ALL');

              setSeverity('ALL');

              setStatus('ALL');

            }}

            className="
              mt-4
              w-full
              rounded-xl
              border
              border-slate-700
              px-3
              py-2.5
              text-xs
              font-semibold
              text-slate-400
              transition
              hover:bg-slate-800
              hover:text-slate-200
            "
          >

            Reset filters

          </button>


          {/* LEGEND */}

          <div className="mt-7 border-t border-slate-800 pt-5">


            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">

              Legend

            </p>


            <div className="mt-4 space-y-3">


              <div className="flex items-center justify-between text-xs text-slate-400">

                <span className="flex items-center gap-2">

                  <span className="h-3 w-3 rounded-full bg-red-400" />

                  Critical incident

                </span>


                <span>

                  {
                    incidents.filter(
                      (incident) =>
                        incident.severity === 'CRITICAL'
                    ).length
                  }

                </span>

              </div>


              <div className="flex items-center justify-between text-xs text-slate-400">

                <span className="flex items-center gap-2">

                  <span className="h-3 w-3 rounded-full bg-orange-400" />

                  High severity

                </span>


                <span>

                  {
                    incidents.filter(
                      (incident) =>
                        incident.severity === 'HIGH'
                    ).length
                  }

                </span>

              </div>


              <div className="flex items-center justify-between text-xs text-slate-400">

                <span className="flex items-center gap-2">

                  <span className="h-3 w-3 rounded-full bg-blue-400" />

                  Active bus

                </span>


                <span>

                  {activeBuses.length}

                </span>

              </div>


            </div>

          </div>


        </Panel>

      </div>

    </div>

  );

}