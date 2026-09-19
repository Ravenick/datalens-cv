import { useChartSize, formatNumber } from '@/lib/chartUtils';

interface Props {
  labels: string[];
  values: number[];
  color?: string;
  horizontal?: boolean;
  maxLabelLength?: number;
}

export function BarChart({ labels, values, color = '#2563eb', horizontal = false, maxLabelLength = 18 }: Props) {
  const { ref, size } = useChartSize();

  if (values.length === 0) {
    return <div ref={ref} className="flex items-center justify-center text-slate-400 text-sm h-[300px]">No data to plot</div>;
  }

  const truncate = (s: string) => (s.length > maxLabelLength ? s.slice(0, maxLabelLength) + '…' : s);

  if (horizontal) {
    const height = Math.max(values.length * 28 + 24, 200);
    const padding = { top: 12, right: 60, bottom: 12, left: 140 };
    const chartW = size.width - padding.left - padding.right;
    const maxVal = Math.max(...values, 0);
    const barH = 20;
    const gap = (height - padding.top - padding.bottom - values.length * barH) / Math.max(values.length - 1, 1);

    return (
      <div ref={ref}>
        <svg width={size.width} height={height}>
          {values.map((v, i) => {
            const y = padding.top + i * (barH + gap);
            const barW = (Math.abs(v) / (maxVal || 1)) * chartW;
            return (
              <g key={i}>
                <text x={padding.left - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize={11} fill="#475569">{truncate(labels[i] ?? '')}</text>
                <rect x={padding.left} y={y} width={Math.max(barW, 1)} height={barH} fill={color} opacity={0.85} rx={3}>
                  <title>{`${labels[i]}: ${formatNumber(v)}`}</title>
                </rect>
                <text x={padding.left + barW + 6} y={y + barH / 2 + 4} fontSize={11} fill="#64748b">{formatNumber(v, { compact: true })}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  const height = 300;
  const padding = { top: 20, right: 16, bottom: 60, left: 56 };
  const chartW = size.width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...values, 0);
  const barW = chartW / values.length;

  return (
    <div ref={ref}>
      <svg width={size.width} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = padding.top + chartH - f * chartH;
          const val = f * maxVal;
          return (
            <g key={f}>
              <line x1={padding.left} y1={y} x2={size.width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">{formatNumber(val, { compact: true })}</text>
            </g>
          );
        })}
        {values.map((v, i) => {
          const barH = (v / (maxVal || 1)) * chartH;
          const x = padding.left + i * barW;
          const y = padding.top + chartH - barH;
          return (
            <g key={i}>
              <rect x={x + 2} y={y} width={Math.max(barW - 4, 1)} height={barH} fill={color} opacity={0.85} rx={3}>
                <title>{`${labels[i]}: ${formatNumber(v)}`}</title>
              </rect>
              <text x={x + barW / 2} y={height - padding.bottom + 18} textAnchor="end" fontSize={11} fill="#475569" transform={`rotate(-30, ${x + barW / 2}, ${height - padding.bottom + 18})`}>{truncate(labels[i] ?? '')}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
