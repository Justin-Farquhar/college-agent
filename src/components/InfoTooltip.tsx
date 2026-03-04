 'use client';

import { useState, type ReactNode } from 'react';

type InfoTooltipProps = {
  label: string;
  children: ReactNode;
};

export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        i
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-1 w-72 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-950 p-2 text-[11px] leading-snug text-slate-100 shadow-lg">
          {children}
        </div>
      )}
    </span>
  );
}

