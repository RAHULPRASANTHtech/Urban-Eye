import type {
  ReactNode,
} from 'react';


type BadgeProps = {

  value?: string;

  children?: ReactNode;

};


const colors: Record<
  string,
  string
> = {

  // =========================================================
  // SEVERITY
  // =========================================================

  LOW:
    'bg-slate-700/50 text-slate-300 border-slate-600',

  MEDIUM:
    'bg-amber-400/10 text-amber-300 border-amber-400/20',

  HIGH:
    'bg-orange-400/10 text-orange-300 border-orange-400/20',

  CRITICAL:
    'bg-red-400/10 text-red-300 border-red-400/20',


  // =========================================================
  // INCIDENT STATUS
  // =========================================================

  NEW:
    'bg-sky-400/10 text-sky-300 border-sky-400/20',

  UNDER_REVIEW:
    'bg-violet-400/10 text-violet-300 border-violet-400/20',

  CONFIRMED:
    'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',

  IN_PROGRESS:
    'bg-blue-400/10 text-blue-300 border-blue-400/20',

  RESOLVED:
    'bg-slate-700/50 text-slate-300 border-slate-600',


  // =========================================================
  // BUS STATUS
  // =========================================================

  ACTIVE:
    'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',

  IDLE:
    'bg-amber-400/10 text-amber-300 border-amber-400/20',

  OFFLINE:
    'bg-red-400/10 text-red-300 border-red-400/20',

};


export default function Badge({
  value,
  children,
}: BadgeProps) {

  const rawValue =
    value ??
    String(children ?? '');


  const displayValue =
    rawValue.replaceAll(
      '_',
      ' '
    );


  const colorClass =
    colors[rawValue] ??
    'bg-slate-800 text-slate-300 border-slate-700';


  return (

    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-semibold
        tracking-[0.14em]
        ${colorClass}
      `}
    >

      {displayValue}

    </span>

  );

}