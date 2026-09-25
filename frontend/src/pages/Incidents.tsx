import {
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import IncidentRow from '../components/incidents/IncidentRow';

import Panel from '../components/ui/Panel';

import {
  useUrbanEye,
} from '../store/UrbanEyeContext';


export default function Incidents() {

  const {
    incidents,
    loading,
    error,
  } = useUrbanEye();


  const [query, setQuery] =
    useState('');


  const [severity, setSeverity] =
    useState('ALL');


  // =========================================================
  // FILTER INCIDENTS
  // =========================================================

  const filteredIncidents =
    useMemo(
      () => {

        return incidents.filter(
          (incident) => {

            const matchesSeverity =
              severity === 'ALL' ||
              incident.severity === severity;


            const searchableText =
              `${incident.id} ${incident.type} ${incident.source_bus}`
                .toLowerCase();


            const matchesSearch =
              searchableText.includes(
                query.toLowerCase()
              );


            return (
              matchesSeverity &&
              matchesSearch
            );

          }
        );

      },
      [
        incidents,
        query,
        severity,
      ]
    );


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="space-y-6">


      {/* HEADER */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">
          Incident operations
        </p>


        <h1 className="mt-2 text-2xl font-semibold text-white">
          Incidents
        </h1>


        <p className="mt-2 text-sm text-slate-400">
          Search, filter and inspect geographically verified events.
        </p>

      </div>


      {/* INCIDENT REGISTRY */}

      <Panel

        title="Incident registry"

        action={

          <div className="flex gap-2">


            {/* SEARCH */}

            <div className="relative">

              <Search
                className="absolute left-3 top-2.5 text-slate-500"
                size={15}
              />


              <input

                value={query}

                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }

                placeholder="Search incidents"

                className="
                  w-48
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/50
                  py-2
                  pl-9
                  pr-3
                  text-xs
                  text-slate-200
                  outline-none
                  focus:border-teal-400/40
                  sm:w-64
                "

              />

            </div>


            {/* SEVERITY FILTER */}

            <div className="relative">

              <SlidersHorizontal
                className="absolute left-3 top-2.5 text-slate-500"
                size={15}
              />


              <select

                value={severity}

                onChange={(event) =>
                  setSeverity(
                    event.target.value
                  )
                }

                className="
                  appearance-none
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950/50
                  py-2
                  pl-9
                  pr-8
                  text-xs
                  text-slate-300
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

            </div>

          </div>

        }

      >


        {/* TABLE HEADER */}

        <div
          className="
            mb-2
            grid
            grid-cols-[1fr_1.2fr_.8fr_.7fr_.9fr]
            gap-3
            border-b
            border-slate-800
            px-3
            pb-3
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.16em]
            text-slate-600
          "
        >

          <span>ID</span>

          <span>Type</span>

          <span>Severity</span>

          <span>Verify</span>

          <span>Status</span>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="py-12 text-center text-sm text-slate-500">

            Loading incidents...

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="py-12 text-center text-sm text-rose-400">

            {error}

          </div>

        )}


        {/* INCIDENT LIST */}

        {!loading &&
          !error &&
          filteredIncidents.length > 0 && (

            <div>

              {filteredIncidents.map(
                (incident) => (

                  <IncidentRow

                    key={incident.id}

                    incident={incident}

                  />

                )
              )}

            </div>

          )}


        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          filteredIncidents.length === 0 && (

            <div className="py-12 text-center text-sm text-slate-500">

              No incidents match your filters.

            </div>

          )}

      </Panel>

    </div>

  );

}