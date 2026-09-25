import {
  Activity,
  AlertTriangle,
  BusFront,
  Construction,
  Radar,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import MetricCard from '../components/dashboard/MetricCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';

import Panel from '../components/ui/Panel';
import Badge from '../components/ui/Badge';

import {
  useUrbanEye,
} from '../store/UrbanEyeContext';


export default function Dashboard() {

  const {

    incidents,

    summary,

    activities,

    loading,

    error,

  } = useUrbanEye();


  // =========================================================
  // RECENT INCIDENTS
  // =========================================================

  const latest =
    incidents.slice(0, 4);


  // =========================================================
  // INCIDENT COUNTS
  // =========================================================

  const criticalCount =
    incidents.filter(
      (incident) =>
        incident.severity === 'CRITICAL'
    ).length;


  const highCount =
    incidents.filter(
      (incident) =>
        incident.severity === 'HIGH'
    ).length;


  const confirmedCount =
    incidents.filter(
      (incident) =>
        incident.status === 'CONFIRMED'
    ).length;


  return (

    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">
          Operational overview
        </p>


        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          City command center
        </h1>


        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          A city-wide view of incidents detected by the distributed
          public transport sensing network.
        </p>

      </div>


      {/* =====================================================
          BACKEND ERROR MESSAGE
      ===================================================== */}

      {error && (

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">

          {error}

        </div>

      )}


      {/* =====================================================
          METRICS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <MetricCard
          label="Total incidents"
          value={summary.total_incidents}
          icon={Radar}
          delta="Across active sensing routes"
        />


        <MetricCard
          label="Active incidents"
          value={summary.active_incidents}
          icon={Activity}
        />


        <MetricCard
          label="Critical incidents"
          value={summary.critical_incidents}
          icon={AlertTriangle}
        />


        <MetricCard
          label="Potholes detected"
          value={summary.potholes}
          icon={Construction}
        />


        <MetricCard
          label="Active buses"
          value={summary.active_buses}
          icon={BusFront}
        />

      </div>


      {/* =====================================================
          LOADING STATE
      ===================================================== */}

      {loading && incidents.length === 0 ? (

        <div className="rounded-xl border border-slate-800 bg-slate-950/30 px-5 py-8 text-center">

          <p className="text-sm text-slate-400">
            Loading UrbanEye command center data...
          </p>

        </div>

      ) : (

        <>

          {/* =================================================
              MAIN DASHBOARD
          ================================================= */}

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">


            {/* =============================================
                RECENT INCIDENTS
            ============================================= */}

            <Panel
              title="Recent incidents"
              subtitle="Most recent events entering the command center"

              action={

                <Link
                  to="/incidents"
                  className="text-xs font-semibold text-teal-300 transition hover:text-teal-200"
                >
                  View all
                </Link>

              }
            >

              {latest.length === 0 ? (

                <div className="flex min-h-40 items-center justify-center">

                  <p className="text-sm text-slate-500">
                    No incidents detected yet.
                  </p>

                </div>

              ) : (

                <div className="space-y-1">

                  {latest.map(
                    (incident) => (

                      <Link
                        key={incident.id}

                        to={`/incidents/${incident.incident_id ?? incident.id}`}

                        className="grid grid-cols-[0.8fr_1.3fr_0.8fr_0.6fr] items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-800/50"
                      >

                        <div className="font-mono text-xs text-slate-300">
                          {incident.id}
                        </div>


                        <div>

                          <div className="text-xs font-semibold text-slate-200">

                            {incident.type
                              .replaceAll('_', ' ')
                              .replace(
                                /\b\w/g,
                                (char) =>
                                  char.toUpperCase()
                              )}

                          </div>


                          <div className="mt-1 text-[10px] text-slate-500">
                            {incident.source_bus}
                          </div>

                        </div>


                        <Badge
                          value={incident.severity}
                        />


                        <div className="text-right text-xs font-semibold text-teal-300">
                          {incident.verification_score}%
                        </div>

                      </Link>

                    )
                  )}

                </div>

              )}

            </Panel>


            {/* =============================================
                ACTIVITY
            ============================================= */}

            <Panel
              title="Recent activity"
              subtitle="Live event stream"
            >

              <ActivityFeed
                items={activities}
              />

            </Panel>


          </div>


          {/* =================================================
              QUICK INCIDENT OVERVIEW
          ================================================= */}

          <Panel
            title="Quick incident overview"
            subtitle="Current state across the sensing network"
          >

            <div className="grid gap-3 sm:grid-cols-3">


              {/* CRITICAL */}

              <div className="rounded-xl border border-rose-400/10 bg-rose-400/5 p-4">

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300">
                  Critical
                </p>


                <p className="mt-2 text-2xl font-semibold text-white">
                  {criticalCount}
                </p>


                <p className="mt-1 text-xs text-slate-500">
                  Incidents requiring immediate attention
                </p>

              </div>


              {/* HIGH */}

              <div className="rounded-xl border border-orange-400/10 bg-orange-400/5 p-4">

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-300">
                  High severity
                </p>


                <p className="mt-2 text-2xl font-semibold text-white">
                  {highCount}
                </p>


                <p className="mt-1 text-xs text-slate-500">
                  High-priority infrastructure or safety events
                </p>

              </div>


              {/* CONFIRMED */}

              <div className="rounded-xl border border-teal-400/10 bg-teal-400/5 p-4">

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300">
                  Confirmed
                </p>


                <p className="mt-2 text-2xl font-semibold text-white">
                  {confirmedCount}
                </p>


                <p className="mt-1 text-xs text-slate-500">
                  Incidents supported by multiple observations
                </p>

              </div>


            </div>

          </Panel>


          {/* =================================================
              SYSTEM STATUS
          ================================================= */}

          <Panel
            title="System status"
            subtitle="Edge, message transport and platform services"
          >

            <div className="grid gap-3 sm:grid-cols-4">

              {[
                'AI Processing',
                'MQTT Broker',
                'GIS Services',
                'Backend API',
              ].map(
                (service) => (

                  <div
                    key={service}

                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3"
                  >

                    <span className="text-xs text-slate-300">
                      {service}
                    </span>


                    <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">

                      <span className="pulse-soft h-2 w-2 rounded-full bg-emerald-300" />

                      Online

                    </span>

                  </div>

                )
              )}

            </div>

          </Panel>

        </>

      )}

    </div>

  );

}