import {
  ArrowLeft,
  Check,
  MapPin,
  Radio,
  ShieldCheck,
  Video,
} from 'lucide-react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import Panel from '../components/ui/Panel';

import Badge from '../components/ui/Badge';

import {
  useUrbanEye,
} from '../store/UrbanEyeContext';


function Step({
  title,
  subtitle,
  done = true,
}: {
  title: string;
  subtitle: string;
  done?: boolean;
}) {

  return (

    <div className="flex gap-4">

      <div
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          ${
            done
              ? 'bg-teal-400/10 text-teal-300 ring-1 ring-teal-300/20'
              : 'bg-slate-800 text-slate-500'
          }
        `}
      >

        {done ? (

          <Check size={15} />

        ) : (

          <span className="h-2 w-2 rounded-full bg-current" />

        )}

      </div>


      <div>

        <div className="text-sm font-semibold text-slate-200">

          {title}

        </div>


        <div className="mt-1 text-xs text-slate-500">

          {subtitle}

        </div>

      </div>

    </div>

  );

}


export default function IncidentDetails() {

  const {
    id,
  } = useParams();


  const {
    incidents,
    loading,
    simulateIncident,
    resetDemo,
  } = useUrbanEye();


  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {

    return (

      <div className="py-20 text-center text-sm text-slate-500">

        Loading incident details...

      </div>

    );

  }


  // =========================================================
  // FIND INCIDENT
  // =========================================================

  const incident =
    incidents.find(
      (item) => item.id === id
    );


  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!incident) {

    return (

      <div className="space-y-6">

        <Link
          to="/incidents"
          className="
            inline-flex
            items-center
            gap-2
            text-xs
            font-semibold
            text-slate-400
            hover:text-white
          "
        >

          <ArrowLeft size={15} />

          Back to incidents

        </Link>


        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">

          <h2 className="text-lg font-semibold text-white">

            Incident not found

          </h2>

          <p className="mt-2 text-sm text-slate-500">

            The requested incident does not exist or has not been loaded.

          </p>

        </div>

      </div>

    );

  }


  // =========================================================
  // PAGE
  // =========================================================

  return (

    <div className="space-y-6">


      {/* BACK */}

      <Link
        to="/incidents"
        className="
          inline-flex
          items-center
          gap-2
          text-xs
          font-semibold
          text-slate-400
          hover:text-white
        "
      >

        <ArrowLeft size={15} />

        Back to incidents

      </Link>


      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>

          <div className="flex items-center gap-2">

            <span className="font-mono text-xs text-slate-500">

              {incident.id}

            </span>

            <Badge value={incident.status} />

          </div>


          <h1 className="mt-2 text-3xl font-semibold text-white">

            {incident.type
              .replaceAll('_', ' ')
              .replace(/\b\w/g, (char) =>
                char.toUpperCase()
              )}

          </h1>


          <p className="mt-2 max-w-2xl text-sm text-slate-400">

            {incident.description}

          </p>

        </div>


        <Badge value={incident.severity} />

      </div>


      {/* MAIN GRID */}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">


        {/* LEFT COLUMN */}

        <div className="space-y-5">


          {/* EVIDENCE */}

          <Panel
            title="Evidence"
            subtitle="Selected frame from edge validation"
          >

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">

              {incident.evidence_image ? (

                <img
                  src={incident.evidence_image}
                  alt="Incident evidence"
                  className="aspect-video w-full object-cover"
                />

              ) : (

                <div
                  className="
                    flex
                    aspect-video
                    items-center
                    justify-center
                    text-sm
                    text-slate-600
                  "
                >

                  No evidence image available

                </div>

              )}

            </div>


            {/* METADATA */}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">


              <div className="rounded-xl border border-slate-800 p-3">

                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">

                  Source bus

                </p>

                <p className="mt-2 text-sm font-semibold text-slate-200">

                  {incident.source_bus}

                </p>

              </div>


              <div className="rounded-xl border border-slate-800 p-3">

                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">

                  Frames

                </p>

                <p className="mt-2 text-sm font-semibold text-slate-200">

                  {incident.frames_validated}/
                  {incident.validation_total}

                </p>

              </div>


              <div className="rounded-xl border border-slate-800 p-3">

                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">

                  Latitude

                </p>

                <p className="mt-2 font-mono text-xs font-semibold text-slate-200">

                  {incident.latitude}

                </p>

              </div>


              <div className="rounded-xl border border-slate-800 p-3">

                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">

                  Longitude

                </p>

                <p className="mt-2 font-mono text-xs font-semibold text-slate-200">

                  {incident.longitude}

                </p>

              </div>


            </div>

          </Panel>


          {/* TRUST PIPELINE */}

          <Panel
            title="Trust pipeline"
            subtitle="Why the city can act on this event"
          >

            <div className="space-y-6">

              <Step
                title="AI Detection"
                subtitle="Candidate road anomaly identified in continuous video"
              />


              <Step
                title="Multi-frame Validation"
                subtitle={`${incident.frames_validated}/${incident.validation_total} frames were consistent`}
              />


              <Step
                title="Bus 1 Confirmation"
                subtitle={`${incident.source_bus} created the initial event`}
              />


              <Step
                title="Bus 2+ Spatial Match"
                subtitle={`${incident.confirmed_buses} independent bus observations support this incident`}
                done={incident.confirmed_buses >= 2}
              />

            </div>

          </Panel>

        </div>


        {/* RIGHT COLUMN */}

        <div className="space-y-5">


          {/* VERIFICATION */}

          <Panel
            title="Verification score"
          >

            <div className="mb-4 flex flex-wrap gap-2">


              <button
                onClick={() =>
                  simulateIncident(
                    incident.id
                  )
                }
                className="
                  rounded-xl
                  border
                  border-teal-300/20
                  bg-teal-400/10
                  px-3
                  py-2
                  text-[11px]
                  font-semibold
                  text-teal-200
                  hover:bg-teal-400/15
                "
              >

                Simulate second-bus confirmation

              </button>


              <button
                onClick={resetDemo}
                className="
                  rounded-xl
                  border
                  border-slate-700
                  px-3
                  py-2
                  text-[11px]
                  font-semibold
                  text-slate-400
                  hover:bg-slate-800
                "
              >

                Reset

              </button>

            </div>


            <div className="flex items-end justify-between">

              <div className="text-5xl font-semibold text-white">

                {incident.verification_score}%

              </div>


              <ShieldCheck
                className="text-teal-300"
                size={30}
              />

            </div>


            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-teal-300 transition-all duration-500"
                style={{
                  width:
                    `${incident.verification_score}%`,
                }}
              />

            </div>


            <p className="mt-3 text-xs text-slate-500">

              Confidence increases as independent buses corroborate the same location.

            </p>

          </Panel>


          {/* INCIDENT CONTEXT */}

          <Panel
            title="Incident context"
          >

            <div className="space-y-4 text-sm">


              <div className="flex items-center gap-3">

                <MapPin
                  size={16}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">

                    GPS location

                  </p>

                  <p className="mt-1 font-mono text-xs text-slate-300">

                    {incident.latitude}, {incident.longitude}

                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <Radio
                  size={16}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">

                    Confirmed by

                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-200">

                    {incident.confirmed_buses} independent buses

                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <Video
                  size={16}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">

                    Timestamp

                  </p>

                  <p className="mt-1 text-xs text-slate-300">

                    {new Date(
                      incident.timestamp
                    ).toLocaleString()}

                  </p>

                </div>

              </div>


            </div>

          </Panel>


          {/* DEMO INSIGHT */}

          <div
            className="
              rounded-2xl
              border
              border-teal-300/10
              bg-teal-400/5
              p-5
            "
          >

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">

              Verification insight

            </p>


            <p className="mt-2 text-sm leading-6 text-slate-300">

              The verification score increases when independent buses detect
              and corroborate the same incident location.

            </p>

          </div>


        </div>

      </div>

    </div>

  );

}