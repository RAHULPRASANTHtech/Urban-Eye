import type { ReactNode } from 'react';


export default function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {

  return (

    <section
      className={`
        rounded-2xl
        border
        border-slate-800/90
        bg-[#0b1727]/90
        shadow-2xl
        shadow-black/10
        ${className}
      `}
    >

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-slate-800/80
          px-5
          py-4
        "
      >

        {title ? (

          <div>

            <h2 className="text-sm font-semibold tracking-wide text-slate-100">

              {title}

            </h2>


            {subtitle && (

              <p className="mt-1 text-xs text-slate-500">

                {subtitle}

              </p>

            )}

          </div>

        ) : (

          <div />

        )}


        {action}

      </div>


      <div className="p-5">

        {children}

      </div>

    </section>

  );

}