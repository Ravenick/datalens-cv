import type { ColumnStat } from '@/lib/types';
import { formatNumber } from '@/lib/chartUtils';

interface Props {
  stats: ColumnStat[];
}

export function ColumnStats({ stats }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Column Statistics</h2>
        <p className="text-sm text-slate-500">Automatic summary statistics for each column</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 truncate" title={stat.name}>{stat.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                stat.type === 'number' ? 'bg-blue-50 text-blue-700' :
                stat.type === 'string' ? 'bg-emerald-50 text-emerald-700' :
                stat.type === 'date' ? 'bg-amber-50 text-amber-700' :
                'bg-rose-50 text-rose-700'
              }`}>{stat.type}</span>
            </div>

            {stat.numeric ? (
              <NumericStatTable stat={stat.numeric} />
            ) : stat.categorical ? (
              <CategoricalStatTable stat={stat.categorical} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function NumericStatTable({ stat }: { stat: NonNullable<ColumnStat['numeric']> }) {
  const rows: [string, string][] = [
    ['Count', stat.count.toString()],
    ['Missing', `${stat.missing} (${((stat.missing / (stat.count + stat.missing)) * 100 || 0).toFixed(1)}%)`],
    ['Mean', formatNumber(stat.mean)],
    ['Median', formatNumber(stat.median)],
    ['Std Dev', formatNumber(stat.std)],
    ['Min', formatNumber(stat.min)],
    ['Max', formatNumber(stat.max)],
    ['Q1', formatNumber(stat.q1)],
    ['Q3', formatNumber(stat.q3)],
    ['IQR', formatNumber(stat.iqr)],
  ];
  return (
    <div className="space-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between items-center text-sm">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-800 tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

function CategoricalStatTable({ stat }: { stat: NonNullable<ColumnStat['categorical']> }) {
  const pct = (count: number) => ((count / (stat.count || 1)) * 100).toFixed(1);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Unique values</span>
        <span className="font-medium text-slate-800 tabular-nums">{stat.unique}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Missing</span>
        <span className="font-medium text-slate-800 tabular-nums">{stat.missing}</span>
      </div>
      {stat.top.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Top Values</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {stat.top.map(({ value, count }) => (
              <div key={value} className="flex justify-between items-center text-sm">
                <span className="text-slate-600 truncate mr-2" title={value}>{value}</span>
                <span className="text-slate-400 text-xs shrink-0 tabular-nums">{count} ({pct(count)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
