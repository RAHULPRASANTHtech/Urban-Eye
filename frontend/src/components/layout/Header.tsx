import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  CircleHelp,
  Radio,
  ShieldAlert,
  TriangleAlert,
  X,
} from 'lucide-react';

import { useUrbanEye } from '../../store/UrbanEyeContext';

export default function Header() {
  const { activities, incidents } = useUrbanEye();

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [read, setRead] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  const latestCritical = incidents.find(
    (incident) => incident.severity === 'CRITICAL'
  );

  const alerts = activities.slice(0, 5);

  const unreadCount = read
    ? 0
    : Math.min(alerts.length, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const getAlertMeta = (
    kind: string,
    message: string
  ) => {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('critical') ||
      normalized.includes('pedestrian risk')
    ) {
      return {
        icon: ShieldAlert,
        label: 'CRITICAL INCIDENT',
        className:
          'bg-rose-400/10 text-rose-300 ring-1 ring-rose-300/10',
      };
    }

    if (
      normalized.includes('confirmed') ||
      kind === 'confirmation'
    ) {
      return {
        icon: CheckCircle2,
        label: 'INCIDENT CONFIRMED',
        className:
          'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/10',
      };
    }

    if (
      normalized.includes('high') ||
      normalized.includes('pothole') ||
      kind === 'detection'
    ) {
      return {
        icon: TriangleAlert,
        label: 'HIGH SEVERITY DETECTED',
        className:
          'bg-orange-400/10 text-orange-300 ring-1 ring-orange-300/10',
      };
    }

    if (kind === 'validation') {
      return {
        icon: Radio,
        label: 'VALIDATION COMPLETE',
        className:
          'bg-blue-400/10 text-blue-300 ring-1 ring-blue-300/10',
      };
    }

    return {
      icon: Radio,
      label: 'SYSTEM ACTIVITY',
      className:
        'bg-slate-800 text-slate-300',
    };
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#081321]/90 px-4 backdrop-blur-xl sm:px-6">
      {/* Left side */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">
          Smart City Operations
        </p>

        <h1 className="mt-1 text-sm font-semibold text-slate-100">
          UrbanEye AI
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* System status */}
        <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300 sm:flex sm:items-center sm:gap-2">
          <span className="pulse-soft h-2 w-2 rounded-full bg-emerald-300" />
          System Live
        </div>

        {/* Notifications */}
        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            onClick={() => {
              setNotificationsOpen(
                (previous) => !previous
              );
              setRead(true);
            }}
            className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Open notifications"
          >
            <Bell size={17} />

            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-400 px-1 text-[9px] font-bold text-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1727] shadow-2xl shadow-black/40">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Alerts
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Live command-center activity
                  </p>
                </div>

                <button
                  onClick={() =>
                    setNotificationsOpen(false)
                  }
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Critical incident summary */}
              {latestCritical && (
                <div className="border-b border-rose-400/10 bg-rose-400/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      size={14}
                      className="text-rose-300"
                    />

                    <span className="text-[10px] font-bold uppercase tracking-[.15em] text-rose-300">
                      Critical attention
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-200">
                    {latestCritical.id} ·{' '}
                    {latestCritical.type.replaceAll(
                      '_',
                      ' '
                    )}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Verification:{' '}
                    {latestCritical.verification_score}%
                    {' · '}
                    {latestCritical.confirmed_buses}{' '}
                    confirming buses
                  </p>
                </div>
              )}

              {/* Alert list */}
              <div className="max-h-[380px] overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert) => {
                    const meta = getAlertMeta(
                      alert.kind,
                      alert.message
                    );

                    const Icon = meta.icon;

                    return (
                      <div
                        key={alert.id}
                        className="flex gap-3 border-b border-slate-800/70 px-4 py-3 transition hover:bg-slate-800/40"
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.className}`}
                        >
                          <Icon size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-500">
                              {meta.label}
                            </p>

                            <span className="shrink-0 text-[10px] text-slate-600">
                              {alert.time}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-10 text-center">
                    <Bell
                      size={22}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      No new alerts
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      The command center is quiet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[.15em] text-slate-600">
                    Alert stream
                  </span>

                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Live
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Help"
        >
          <CircleHelp size={17} />
        </button>

        {/* User avatar */}
        <div className="h-8 w-8 rounded-full bg-slate-700 ring-1 ring-slate-600" />
      </div>
    </header>
  );
}