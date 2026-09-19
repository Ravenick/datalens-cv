import { useChartSize, niceTicks, formatNumber } from '@/lib/chartUtils';

interface Props {
  x: number[];
  y: number[];
  color?: string;
  xLabel?: string;
  yLabel?: string;
}

export function LineChart({ x, y, color = '#2563eb', xLabel, yLabel }: Props) {
  const { ref, size } = useChartSize();
  const height = 320;
  const padding = { top: 20, right: 20, bottom: 48, left: 60 };
  const w = size.width;
  const h = height;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  if (x.length < 2) {
    return <div ref={ref} className="flex items-center justify-center text-slate-400 text-sm h-[320px]">Need at least 2 points for a line chart</div>;
  }

  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const points = x.map((xi, i) => {
    const px = padding.left + ((xi - xMin) / xRange) * chartW;
    const py = padding.top + chartH - ((y[i] - yMin) / yRange) * chartH;
    return { px, py, x: xi, y: y[i] };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');
  const xTicks = niceTicks(xMin, xMax, 6);
  const yTicks = niceTicks(yMin, yMax, 5);

  return (
    <div ref={ref}>
      <svg width={w} height={h}>
        {yTicks.map((t) => {
          const py = padding.top + chartH - ((t - yMin) / yRange) * chartH;
          return (
            <g key={t}>
              <line x1={padding.left} y1={py} x2={w - padding.right} y2={py} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padding.left - 8} y={py + 4} textAnchor="end" fontSize={11} fill="#64748b">{formatNumber(t, { compact: true })}</text>
            </g>
          );
        })}
        {xTicks.map((t) => {
          const px = padding.left + ((t - xMin) / xRange) * chartW;
          return <text key={t} x={px} y={h - padding.bottom + 18} textAnchor="middle" fontSize={11} fill="#64748b">{formatNumber(t, { compact: true })}</text>;
        })}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.px} cy={p.py} r={3} fill={color}>
            <title>{`${xLabel ?? 'x'}: ${formatNumber(p.x)}\n${yLabel ?? 'y'}: ${formatNumber(p.y)}`}</title>
          </circle>
        ))}
        {yLabel && <text x={14} y={h / 2} textAnchor="middle" fontSize={12} fill="#475569" transform={`rotate(-90, 14, ${h / 2})`}>{yLabel}</text>}
        {xLabel && <text x={w / 2} y={h - 4} textAnchor="middle" fontSize={12} fill="#475569">{xLabel}</text>}
      </svg>
    </div>
  );
}
