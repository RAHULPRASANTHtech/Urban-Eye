import { CheckCircle2, CircleAlert, Radar, Waypoints } from 'lucide-react';
import type { Activity } from '../../types';

const icons = {
  detection: Radar,
  validation: CheckCircle2,
  confirmation: Waypoints,
  system: CircleAlert,
};

export default function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <div className="space-y-4">
      {items.map((a) => {
        const I = icons[a.kind];

        return (
          <div key={a.id} className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
              <I size={14} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">{a.message}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Today · {a.time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}