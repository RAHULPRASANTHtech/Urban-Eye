import {
  BusFront,
  MapPin,
  Radio,
} from 'lucide-react';

import Panel from '../components/ui/Panel';
import Badge from '../components/ui/Badge';

import {
  useUrbanEye,
} from '../store/UrbanEyeContext';


export default function Fleet() {

  const {
    buses,
    loading,
    error,
  } = useUrbanEye();


  // =========================================================
  // FLEET METRICS
  // =========================================================

  const activeBuses =
    buses.filter(
      (bus) => bus.status === 'ACTIVE'
    ).length;


  const idleBuses =
    buses.filter(
      (bus) => bus.status === 'IDLE'
    ).length;


  const offlineBuses =
    buses.filter(
      (bus) => bus.status === 'OFFLINE'
    ).length;


  const networkStatus =
    activeBuses > 0
      ? 'NETWORK ACTIVE'
      : buses.length > 0
        ? 'LIMITED AVAILABILITY'
        : 'NO ACTIVE CONNECTION';


  // =========================================================
  // PAGE
  // =========================================================

  return (

    <div className="space-y-6">


      {/* HEADER */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">

          Distributed sensing network

        </p>


        <h1 className="mt-2 text-2xl font-semibold text-white">

          Fleet

        </h1>


        <p className="mt-2 text-sm text-slate-400">

          Health and location status for buses contributing urban
          observations.

        </p>

      </div>


      {/* FLEET SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-3">


        {/* TOTAL BUSES */}

        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">

            Total buses

          </p>


          <p className="mt-2 text-2xl font-semibold text-white">

            {buses.length}

          </p>


          <p className="mt-1 text-xs text-slate-500">

            Registered sensing vehicles

          </p>

        </div>


        {/* ACTIVE BUSES */}

        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">

            Active buses

          </p>


          <p className="mt-2 text-2xl font-semibold text-white">

            {activeBuses}

          </p>


          <p className="mt-1 text-xs text-slate-500">

            Currently reporting observations

          </p>

        </div>


        {/* NETWORK STATUS */}

        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">

            Sensing status

          </p>


          <p
            className={`
              mt-2
              text-sm
              font-semibold
              ${
                activeBuses > 0
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }
            `}
          >

            {networkStatus}

          </p>


          <p className="mt-1 text-xs text-slate-500">

            {offlineBuses > 0
              ? `${offlineBuses} bus(es) currently offline`
              : 'All connected fleet systems available'}

          </p>

        </div>


      </div>


      {/* FLEET TABLE */}

      <Panel

        title="Sensing fleet"

        subtitle={
          loading
            ? 'Loading fleet data...'
            : `${buses.length} buses registered in the network`
        }

      >


        {/* LOADING */}

        {loading && (

          <div className="py-12 text-center text-sm text-slate-500">

            Loading fleet information...

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="py-12 text-center text-sm text-rose-400">

            {error}

          </div>

        )}


        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          buses.length === 0 && (

            <div className="py-12 text-center">

              <BusFront
                size={28}
                className="mx-auto text-slate-700"
              />


              <p className="mt-3 text-sm text-slate-500">

                No buses are currently registered in the sensing network.

              </p>

            </div>

          )}


        {/* BUS LIST */}

        {!loading &&
          !error &&
          buses.length > 0 && (

            <div className="grid gap-3">

              {buses.map(
                (bus) => (

                  <div

                    key={bus.bus_id}

                    className="
                      grid
                      gap-3
                      rounded-2xl
                      border
                      border-slate-800
                      bg-slate-950/20
                      p-4
                      transition
                      hover:border-slate-700
                      hover:bg-slate-900/30
                      sm:grid-cols-[1.5fr_1fr_1.4fr_1fr_1fr]
                      sm:items-center
                    "

                  >


                    {/* BUS */}

                    <div className="flex items-center gap-3">

                      <div className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-400/10
                        text-blue-300
                      ">

                        <BusFront size={18} />

                      </div>


                      <div>

                        <p className="font-mono text-sm font-semibold text-white">

                          {bus.bus_id}

                        </p>


                        <p className="mt-1 text-[11px] text-slate-500">

                          {bus.route || 'Route unavailable'}

                        </p>

                      </div>

                    </div>


                    {/* STATUS */}

                    <Badge value={bus.status} />


                    {/* GPS */}

                    <div className="flex items-center gap-2 text-xs text-slate-400">

                      <MapPin
                        size={14}
                      />


                      <span className="font-mono">

                        {Number(bus.latitude).toFixed(4)},

                        {' '}

                        {Number(bus.longitude).toFixed(4)}

                      </span>

                    </div>


                    {/* LAST SEEN */}

                    <div className="flex items-center gap-2 text-xs text-slate-400">

                      <Radio
                        size={14}
                      />


                      <span>

                        Last seen {bus.last_seen}

                      </span>

                    </div>


                    {/* EVENTS */}

                    <div className="text-xs text-slate-400">

                      <span className="font-semibold text-slate-200">

                        {bus.recent_events}

                      </span>

                      {' '}

                      recent events

                    </div>


                  </div>

                )
              )}

            </div>

          )}


        {/* FLEET FOOTER */}

        {!loading &&
          !error &&
          buses.length > 0 && (

            <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-800 pt-4 text-xs text-slate-500">

              <span>

                <strong className="text-emerald-300">

                  {activeBuses}

                </strong>

                {' '}

                active

              </span>


              <span>

                <strong className="text-amber-300">

                  {idleBuses}

                </strong>

                {' '}

                idle

              </span>


              <span>

                <strong className="text-red-300">

                  {offlineBuses}

                </strong>

                {' '}

                offline

              </span>

            </div>

          )}


      </Panel>

    </div>

  );

}