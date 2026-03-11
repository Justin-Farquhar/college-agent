'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type InfoTooltipProps = {
  label: string;
  children: ReactNode;
};

export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const computeCoords = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipWidth = 288; // w-72 = 18rem
    const vw = window.innerWidth;
    const rawLeft = rect.left + rect.width / 2;
    // Clamp so tooltip never bleeds past either edge of the viewport
    const left = Math.max(
      tooltipWidth / 2 + 8,
      Math.min(vw - tooltipWidth / 2 - 8, rawLeft),
    );
    setCoords({ top: rect.bottom + 4, left });
  };

  // Close the tooltip if the page scrolls so it doesn't float away from its button
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [open]);

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-neon-dim/40 text-[10px] font-semibold text-neon/70 transition-colors duration-150 hover:border-neon/50 hover:bg-neon-dim/20 hover:text-neon focus:outline-none focus:ring-1 focus:ring-neon/50"
        onMouseEnter={() => { computeCoords(); setOpen(true); }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => { computeCoords(); setOpen(true); }}
        onBlur={() => setOpen(false)}
        onClick={() => { computeCoords(); setOpen((p) => !p); }}
      >
        i
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
          className="w-72 rounded-lg border border-neon-dim/25 bg-night-card p-3 text-[11px] leading-snug text-chalk/80 shadow-xl shadow-black/60"
        >
          {children}
        </div>,
        document.body,
      )}
    </span>
  );
}
