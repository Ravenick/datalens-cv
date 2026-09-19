import { useChartSize, formatNumber } from '@/lib/chartUtils';
import { quantile } from '@/lib/stats';

interface Props {
  values: number[];
  label: string;
  color?: string;
}

export function BoxPlot({ values, label, color = '#2563eb' }: Props) {
  const { ref, size } = useChartSize();
  const height = 280;
  const padding = { top: 30, right: 40, bottom: 44, left: 60 };
  const w = size.width;
  const h = height;
  const chartH = h - padding.top - padding.bottom;

  if (values.length < 4) {
    return <div ref={ref} className="flex items-center justify-center text-slate-400 text-sm h-[280px]">Need at least 4 values for a box plot</div>;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const min = Math.max(sorted[0], lowerFence);
  const max = Math.min(sorted[sorted.length - 1], upperFence);
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);

  const allVals = [min, max, q1, q3, ...outliers];
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  const dataRange = dataMax - dataMin || 1;

  const scale = (val: number) => {
    const fraction = (val - dataMin) / dataRange;
    // Horizontal box plot: value on x-axis
    return padding.left + fraction * (w - padding.left - padding.right);
  };

  const centerY = padding.top + chartH / 2;
  const boxH = Math.min(chartH * 0.5, 80);
  const xMin = scale(min);
  const xMax = scale(max);
  const xQ1 = scale(q1);
  const xQ3 = scale(q3);
  const xMed = scale(median);

  return (
    <div ref={ref}>
      <svg width={w} height={h}>
        {/* whiskers */}
        <line x1={xMin} y1={centerY} x2={xQ1} y2={centerY} stroke="#94a3b8" strokeWidth={1.5} />
        <line x1={xQ3} y1={centerY} x2={xMax} y2={centerY} stroke="#94a3b8" strokeWidth={1.5} />
        <line x1={xMin} y1={centerY - boxH / 2} x2={xMin} y2={centerY + boxH / 2} stroke="#94a3b8" strokeWidth={1.5} />
        <line x1={xMax} y1={centerY - boxH / 2} x2={xMax} y2={centerY + boxH / 2} stroke="#94a3b8" strokeWidth={1.5} />
        {/* box */}
        <rect x={xQ1} y={centerY - boxH / 2} width={Math.max(xQ3 - xQ1, 1)} height={boxH} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} rx={3}>
          <title>{`${label}\nQ1: ${formatNumber(q1)}\nMedian: ${formatNumber(median)}\nQ3: ${formatNumber(q3)}\nIQR: ${formatNumber(iqr)}\nMin: ${formatNumber(min)}\nMax: ${formatNumber(max)}\nOutliers: ${outliers.length}`}</title>
        </rect>
        {/* median line */}
        <line x1={xMed} y1={centerY - boxH / 2} x2={xMed} y2={centerY + boxH / 2} stroke={color} strokeWidth={2.5} />
        {/* outliers */}
        {outliers.map((v, i) => (
          <circle key={i} cx={scale(v)} cy={centerY} r={3} fill="none" stroke="#ef4444" strokeWidth={1}>
            <title>{`Outlier: ${formatNumber(v)}`}</title>
          </circle>
        ))}
        {/* stats labels */}
        <text x={xMin} y={centerY - boxH / 2 - 8} textAnchor="middle" fontSize={10} fill="#64748b">{formatNumber(min, { compact: true })}</text>
        <text x={xQ1} y={centerY + boxH / 2 + 14} textAnchor="middle" fontSize={10} fill="#64748b">{formatNumber(q1, { compact: true })}</text>
        <text x={xMed} y={centerY - boxH / 2 - 8} textAnchor="middle" fontSize={10} fill={color} fontWeight={600}>{formatNumber(median, { compact: true })}</text>
        <text x={xQ3} y={centerY + boxH / 2 + 14} textAnchor="middle" fontSize={10} fill="#64748b">{formatNumber(q3, { compact: true })}</text>
        <text x={xMax} y={centerY - boxH / 2 - 8} textAnchor="middle" fontSize={10} fill="#64748b">{formatNumber(max, { compact: true })}</text>
        {/* label */}
        <text x={w / 2} y={h - 8} textAnchor="middle" fontSize={12} fill="#475569">{label}</text>
      </svg>
    </div>
  );
}
