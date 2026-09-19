import { formatNumber } from '@/lib/chartUtils';

interface Props {
  columns: string[];
  matrix: number[][];
}

function corrColor(r: number): string {
  // Blue (negative) → white (zero) → red-orange (positive)
  const clamped = Math.max(-1, Math.min(1, r));
  if (isNaN(clamped)) return '#f1f5f9';
  if (clamped >= 0) {
    const alpha = clamped;
    return `rgba(220, 38, 38, ${alpha})`;
  }
  const alpha = -clamped;
  return `rgba(37, 99, 235, ${alpha})`;
}

export function CorrelationMatrix({ columns, matrix }: Props) {
  const n = columns.length;
  if (n === 0) {
    return <div className="flex items-center justify-center text-slate-400 text-sm h-[200px]">No numeric columns to correlate</div>;
  }

  const cellSize = 44;
  const labelSpace = 110;
  const totalW = labelSpace + n * cellSize + 20;
  const totalH = 20 + n * cellSize + labelSpace;

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={totalH}>
        {/* Column labels */}
        {columns.map((c, i) => {
          const x = labelSpace + i * cellSize + cellSize / 2;
          const y = 14;
          return (
            <text key={i} x={x} y={y} textAnchor="start" fontSize={10} fill="#475569" transform={`rotate(-45, ${x}, ${y})`}>
              {c.length > 18 ? c.slice(0, 18) + '…' : c}
            </text>
          );
        })}
        {/* Row labels */}
        {columns.map((c, i) => (
          <text key={i} x={labelSpace - 6} y={20 + i * cellSize + cellSize / 2 + 3} textAnchor="end" fontSize={10} fill="#475569">
            {c.length > 18 ? c.slice(0, 18) + '…' : c}
          </text>
        ))}
        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((val, j) => {
            const x = labelSpace + j * cellSize;
            const y = 20 + i * cellSize;
            return (
              <g key={`${i}-${j}`}>
                <rect x={x} y={y} width={cellSize - 2} height={cellSize - 2} fill={corrColor(val)} stroke="#fff" strokeWidth={1} rx={3}>
                  <title>{`${columns[i]} × ${columns[j]}\nr = ${formatNumber(val)}`}</title>
                </rect>
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 3} textAnchor="middle" fontSize={9} fill={Math.abs(val) > 0.6 ? '#fff' : '#1e293b'} fontWeight={Math.abs(val) > 0.5 ? 600 : 400}>
                  {isNaN(val) ? '—' : val.toFixed(2)}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
