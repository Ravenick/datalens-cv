import type { Dataset } from '@/lib/types';
import { formatNumber } from '@/lib/chartUtils';

interface Props {
  dataset: Dataset;
}

export function Overview({ dataset }: Props) {
  const numericCols = dataset.columns.filter((c) => c.type === 'number').length;
  const stringCols = dataset.columns.filter((c) => c.type === 'string').length;
  const dateCols = dataset.columns.filter((c) => c.type === 'date').length;
  const boolCols = dataset.columns.filter((c) => c.type === 'boolean').length;

  let missingCount = 0;
  for (const row of dataset.rows) {
    for (const v of row) {
      if (v === null) missingCount++;
    }
  }
  const totalCells = dataset.rows.length * dataset.columns.length;
  const completeness = totalCells > 0 ? ((totalCells - missingCount) / totalCells) * 100 : 0;

  const cards = [
    { label: 'Rows', value: formatNumber(dataset.rows.length, { compact: true }), sub: `${dataset.rows.length.toLocaleString()} total` },
    { label: 'Columns', value: dataset.columns.length.toString(), sub: `${numericCols} numeric · ${stringCols + boolCols} categorical` },
    { label: 'Data Points', value: formatNumber(totalCells, { compact: true }), sub: `${formatNumber(totalCells, { compact: true })} cells` },
    { label: 'Completeness', value: `${completeness.toFixed(1)}%`, sub: missingCount === 0 ? 'No missing values' : `${missingCount.toLocaleString()} missing` },
  ];

  const typeBreakdown = [
    { label: 'Numeric', count: numericCols, color: 'bg-blue-500' },
    { label: 'Text', count: stringCols, color: 'bg-emerald-500' },
    { label: 'Date', count: dateCols, color: 'bg-amber-500' },
    { label: 'Boolean', count: boolCols, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">{dataset.name}</h2>
        <p className="text-sm text-slate-500">Dataset overview · {dataset.rows.length.toLocaleString()} rows × {dataset.columns.length} columns</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-3xl font-bold text-slate-800 tabular-nums">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Column Type Breakdown</h3>
          <div className="space-y-3">
            {typeBreakdown.map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${t.color}`} />
                <span className="text-sm text-slate-600 flex-1">{t.label}</span>
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{t.count}</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color}`} style={{ width: `${dataset.columns.length > 0 ? (t.count / dataset.columns.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Column Summary</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dataset.columns.map((col) => (
              <div key={col.index} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700 font-medium truncate">{col.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  col.type === 'number' ? 'bg-blue-50 text-blue-700' :
                  col.type === 'string' ? 'bg-emerald-50 text-emerald-700' :
                  col.type === 'date' ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>{col.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
