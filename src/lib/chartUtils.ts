import { useState, useRef, useEffect, useCallback } from 'react';

export function useChartSize(defaultWidth = 600, defaultHeight = 320) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize((prev) => ({ ...prev, width: Math.floor(w) }));
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const setHeight = useCallback((h: number) => setSize((prev) => ({ ...prev, height: h })), []);

  return { ref, size, setHeight };
}

function niceNumber(value: number): number {
  if (value === 0) return 0;
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mag = Math.pow(10, exp);
  const norm = value / mag;
  let nice: number;
  if (norm < 1.5) nice = 1;
  else if (norm < 3) nice = 2;
  else if (norm < 7) nice = 5;
  else nice = 10;
  return nice * mag;
}

export function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min];
  const range = niceNumber(max - min);
  const step = niceNumber(range / (count - 1));
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 0.5; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

export function formatNumber(v: number, opts?: { compact?: boolean }): string {
  if (isNaN(v)) return '—';
  if (opts?.compact && Math.abs(v) >= 1000) {
    return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  }
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return v.toString();
  if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(2);
  return Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(v);
}
