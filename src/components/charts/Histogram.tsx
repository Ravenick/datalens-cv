import { useChartSize, niceTicks, formatNumber } from '@/lib/chartUtils';

interface Props {
  data: number[];
  bins: number;
  color?: string;
}

export function Histogram({ data, bins, color = '#2563eb' }: Props) {
  const { ref, size } = useChartSize();
  const height = 300;
  const padding = { top: 20, right: 16, bottom: 44, left: 56 };
  const w = size.width;
  const h = height;

  if (data.length === 0) {
    return <div ref={ref} className="flex items-center justify-center text-slate-400 text-sm h-[300px]">No numeric data to plot</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const binWidth = range / bins;
  const counts = new Array(bins).fill(0);
  for (const v of data) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }
  const maxCount = Math.max(...counts);
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barW = chartW / bins;
  const yTicks = niceTicks(0, maxCount, 5);

  return (
    <div ref={ref}>
      <svg width={w} height={h} className="overflow-visible">
        {yTicks.map((t) => {
          const y = padding.top + chartH - (t / (yTicks[yTicks.length - 1] || 1)) * chartH;
          return (
            <g key={t}>
              <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">{formatNumber(t, { compact: true })}</text>
            </g>
          );
        })}
        {counts.map((c, i) => {
          const barH = (c / (maxCount || 1)) * chartH;
          const x = padding.left + i * barW;
          const y = padding.top + chartH - barH;
          return (
            <g key={i}>
              <rect x={x + 1} y={y} width={Math.max(barW - 2, 1)} height={barH} fill={color} opacity={0.85} rx={2}>
                <title>{`Bin ${i + 1}: ${formatNumber(min + i * binWidth)} – ${formatNumber(min + (i + 1) * binWidth)}\nCount: ${c}`}</title>
              </rect>
            </g>
          );
        })}
        {/* X axis labels - show ~6 labels */}
        {Array.from({ length: Math.min(bins + 1, 7) }).map((_, i) => {
          const tickIdx = Math.round((i / 6) * bins);
          const val = min + tickIdx * binWidth;
          const x = padding.left + tickIdx * barW;
          return <text key={i} x={x} y={h - padding.bottom + 18} textAnchor="middle" fontSize={11} fill="#64748b">{formatNumber(val, { compact: true })}</text>;
        })}
      </svg>
    </div>
  );
}
