import {
  Link,
} from 'react-router-dom';

import Badge from '../ui/Badge';

import type {
  Incident,
} from '../../types';


export default function IncidentRow({
  incident,
}: {
  incident: Incident;
}) {

  const formattedType =
    incident.type
      .replaceAll('_', ' ');


  const verificationScore =
    Number(
      incident.verification_score
    );


  return (

    <Link

      to={`/incidents/${incident.id}`}

      className="
        grid
        grid-cols-[1fr_1.2fr_.8fr_.7fr_.9fr]
        items-center
        gap-3
        rounded-xl
        px-3
        py-3
        transition
        hover:bg-slate-800/50
      "

    >


      {/* INCIDENT ID */}

      <div className="font-mono text-xs text-slate-300">

        {incident.id}

      </div>


      {/* INCIDENT TYPE */}

      <div>

        <div className="text-xs font-semibold text-slate-200">

          {formattedType}

        </div>


        <div className="mt-1 text-[10px] text-slate-500">

          {incident.source_bus || 'UNKNOWN'}

        </div>

      </div>


      {/* SEVERITY */}

      <Badge
        value={incident.severity}
      />


      {/* VERIFICATION */}

      <div className="text-xs font-semibold text-slate-200">

        {Number.isFinite(verificationScore)
          ? `${verificationScore}%`
          : '0%'}

      </div>


      {/* STATUS */}

      <Badge
        value={incident.status}
      />

    </Link>

  );

}