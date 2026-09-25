import {
  BarChart3,
  MapPinned,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import Panel from '../components/ui/Panel';
import { useUrbanEye } from '../store/UrbanEyeContext';

const TOOLTIP_STYLE = {
  background: '#0b1727',
  border: '1px solid #334155',
  borderRadius: 12,
  color: '#e2e8f0',
};

export default function Analytics() {
  const {
    incidents,
    buses,
    summary,
  } = useUrbanEye();

  /*
   * ---------------------------------------------------------
   * CITY-WIDE SUMMARY
   * These values represent the overall sensing network and
   * therefore match the Dashboard.
   * ---------------------------------------------------------
   */

  const totalIncidents = summary.total_incidents;

  const activeIncidents = summary.active_incidents;

  const criticalIncidents = summary.critical_incidents;

  const potholesDetected = summary.potholes;

  const activeBuses = summary.active_buses;

  /*
   * ---------------------------------------------------------
   * DETAILED INCIDENT ANALYSIS
   * These values come from the incidents currently available
   * in the frontend incident registry.
   * ---------------------------------------------------------
   */

  const confirmedIncidents = incidents.filter(
    (incident) => incident.status === 'CONFIRMED'
  ).length;

  const multiBusIncidents = incidents.filter(
    (incident) => incident.confirmed_buses >= 2
  ).length;

  const averageVerification =
    incidents.length > 0
      ? Math.round(
          incidents.reduce(
            (total, incident) =>
              total + incident.verification_score,
            0
          ) / incidents.length
        )
      : 0;

  /*
   * ---------------------------------------------------------
   * INCIDENT TYPE DISTRIBUTION
   * ---------------------------------------------------------
   */

  const typeDefinitions = [
    {
      name: 'Pothole',
      filter: (type: string) => type === 'POTHOLE',
    },
    {
      name: 'Traffic',
      filter: (type: string) => type === 'TRAFFIC',
    },
    {
      name: 'Road damage',
      filter: (type: string) =>
        type === 'ROAD_DAMAGE',
    },
    {
      name: 'Pedestrian risk',
      filter: (type: string) =>
        type === 'PEDESTRIAN_RISK',
    },
    {
      name: 'Infrastructure',
      filter: (type: string) =>
        type === 'INFRASTRUCTURE',
    },
    {
      name: 'Waterlogging',
      filter: (type: string) =>
        type === 'WATERLOGGING',
    },
  ];

  const incidentTypes = typeDefinitions
    .map((definition) => ({
      name: definition.name,
      value: incidents.filter((incident) =>
        definition.filter(incident.type)
      ).length,
    }))
    .filter((item) => item.value > 0);

  /*
   * ---------------------------------------------------------
   * SEVERITY DISTRIBUTION
   * ---------------------------------------------------------
   */

  const severityData = [
    {
      name: 'Critical',
      value: incidents.filter(
        (incident) =>
          incident.severity === 'CRITICAL'
      ).length,
    },
    {
      name: 'High',
      value: incidents.filter(
        (incident) =>
          incident.severity === 'HIGH'
      ).length,
    },
    {
      name: 'Medium',
      value: incidents.filter(
        (incident) =>
          incident.severity === 'MEDIUM'
      ).length,
    },
    {
      name: 'Low',
      value: incidents.filter(
        (incident) =>
          incident.severity === 'LOW'
      ).length,
    },
  ];

  const maxSeverity = Math.max(
    ...severityData.map((item) => item.value),
    1
  );

  /*
   * ---------------------------------------------------------
   * VERIFICATION TREND
   * ---------------------------------------------------------
   */

  const verificationData = incidents
    .slice(0, 8)
    .map((incident) => ({
      id: incident.id,
      verification: incident.verification_score,
      buses: incident.confirmed_buses,
    }))
    .reverse();

  /*
   * ---------------------------------------------------------
   * WEEKLY TREND
   *
   * Historical values are still mock data for now.
   * "Today" uses the city-wide Dashboard summary so the
   * current total remains consistent across the platform.
   * ---------------------------------------------------------
   */

  const weeklyTrend = [
    { day: 'Mon', incidents: 8 },
    { day: 'Tue', incidents: 12 },
    { day: 'Wed', incidents: 7 },
    { day: 'Thu', incidents: 16 },
    { day: 'Fri', incidents: 13 },
    { day: 'Sat', incidents: 19 },
    {
      day: 'Today',
      incidents: totalIncidents,
    },
  ];

  /*
   * ---------------------------------------------------------
   * HOTSPOTS
   *
   * For the current mock layer, an incident confirmed by
   * multiple buses is treated as a multi-observation hotspot.
   * This can later be replaced with actual PostGIS clustering.
   * ---------------------------------------------------------
   */

  const hotspots = incidents
    .filter(
      (incident) => incident.confirmed_buses >= 2
    )
    .sort(
      (a, b) =>
        b.confirmed_buses - a.confirmed_buses ||
        b.verification_score - a.verification_score
    )
    .slice(0, 5);

  /*
   * ---------------------------------------------------------
   * PIE COLORS
   * ---------------------------------------------------------
   */

  const typeColors = [
    '#5eead4',
    '#60a5fa',
    '#a78bfa',
    '#fb7185',
    '#fbbf24',
    '#94a3b8',
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-teal-300">
          Operational intelligence
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          Analytics
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Trends, distributions and verification signals generated
          by the distributed urban sensing network.
        </p>
      </div>

      {/* KPI CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BarChart3 size={15} />

            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Total incidents
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold text-white">
            {totalIncidents}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            City-wide incidents
          </p>
        </div>

        <div className="rounded-2xl border border-teal-400/10 bg-teal-400/5 p-4">
          <div className="flex items-center gap-2 text-teal-300">
            <ShieldCheck size={15} />

            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Average verification
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold text-white">
            {averageVerification}%
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Across visible incidents
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPinned size={15} />

            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Multi-bus confirmations
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold text-white">
            {multiBusIncidents}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Visible incidents confirmed by 2+ buses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp size={15} />

            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Active sensing buses
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold text-white">
            {activeBuses}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            City-wide active fleet
          </p>
        </div>
      </div>

      {/* INCIDENT OVERVIEW */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
            Active incidents
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {activeIncidents}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-400/10 bg-rose-400/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-rose-300">
            Critical incidents
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {criticalIncidents}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-400/10 bg-orange-400/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-orange-300">
            Potholes detected
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {potholesDetected}
          </p>
        </div>
      </div>

      {/* INCIDENTS OVER TIME */}

      <Panel
        title="Incidents over time"
        subtitle="Weekly detection trend"
      >
        <div className="h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart data={weeklyTrend}>
              <CartesianGrid
                stroke="#1e293b"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                stroke="#64748b"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                stroke="#64748b"
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />

              <Bar
                dataKey="incidents"
                fill="#5eead4"
                radius={[7, 7, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* TYPE + SEVERITY */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Incident type distribution"
          subtitle="What the visible incident registry is detecting"
        >
          {incidentTypes.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={incidentTypes}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    label={({ name, value }) =>
                      `${name} ${value}`
                    }
                  >
                    {incidentTypes.map(
                      (item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            typeColors[
                              index %
                                typeColors.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center text-sm text-slate-500">
              No incident type data available.
            </div>
          )}
        </Panel>

        <Panel
          title="Severity distribution"
          subtitle="Current operational priority"
        >
          <div className="space-y-6">
            {severityData.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {item.name}
                  </span>

                  <span className="text-xs font-semibold text-slate-200">
                    {item.value}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-teal-300 transition-all duration-500"
                    style={{
                      width: `${
                        (item.value /
                          maxSeverity) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* VERIFICATION */}

      <Panel
        title="Detection verification"
        subtitle="Verification score and independent bus observations"
      >
        <div className="h-80">
          {verificationData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={verificationData}>
                <CartesianGrid
                  stroke="#1e293b"
                  vertical={false}
                />

                <XAxis
                  dataKey="id"
                  stroke="#64748b"
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                />

                <Line
                  type="monotone"
                  dataKey="verification"
                  stroke="#5eead4"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#5eead4',
                  }}
                  name="Verification"
                />

                <Line
                  type="monotone"
                  dataKey="buses"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: '#60a5fa',
                  }}
                  name="Confirming buses"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No verification data available.
            </div>
          )}
        </div>
      </Panel>

      {/* HOTSPOTS */}

      <Panel
        title="Multi-bus hotspots"
        subtitle="Locations supported by repeated independent observations"
      >
        {hotspots.length > 0 ? (
          <div className="space-y-3">
            {hotspots.map((incident, index) => (
              <div
                key={incident.id}
                className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/20 p-4 sm:grid-cols-[auto_1.5fr_1fr_1fr_1fr]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-xs font-bold text-teal-300">
                  {index + 1}
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {incident.id}
                  </p>

                  <p className="mt-1 text-xs uppercase text-slate-500">
                    {incident.type.replaceAll(
                      '_',
                      ' '
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[.15em] text-slate-600">
                    Location
                  </p>

                  <p className="mt-1 text-xs text-slate-300">
                    {incident.latitude.toFixed(4)},{' '}
                    {incident.longitude.toFixed(4)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[.15em] text-slate-600">
                    Confirmations
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-200">
                    {incident.confirmed_buses}{' '}
                    buses
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[.15em] text-slate-600">
                    Verification
                  </p>

                  <p className="mt-1 text-xs font-semibold text-teal-300">
                    {incident.verification_score}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <MapPinned
              size={24}
              className="mx-auto text-slate-700"
            />

            <p className="mt-3 text-sm text-slate-400">
              No multi-bus hotspots detected yet.
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Hotspots appear when independent buses
              confirm the same incident.
            </p>
          </div>
        )}
      </Panel>

      {/* NETWORK INSIGHT */}

      <Panel
        title="Network insight"
        subtitle="How the sensing network supports city operations"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-teal-300">
              Distributed coverage
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Public buses continuously observe different road
              segments, creating broad mobile sensing coverage.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-300">
              Independent verification
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Repeated observations from different buses can
              increase confidence that an incident is genuine.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-violet-300">
              Actionable intelligence
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Spatially correlated incidents can help authorities
              prioritize inspection, maintenance and response.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}