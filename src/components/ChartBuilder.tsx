import { useState, useMemo } from 'react';
import type { Dataset, ColumnStat } from '@/lib/types';
import { getNumericValues, getPairedNumeric, pearsonCorrelation, quantile } from '@/lib/stats';
import { Histogram } from './charts/Histogram';
import { BarChart } from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { ScatterPlot } from './charts/ScatterPlot';
import { BoxPlot } from './charts/BoxPlot';
import { CorrelationMatrix } from './charts/CorrelationMatrix';
import type { ColumnType } from '@/lib/types';
import { Download } from 'lucide-react';

interface Props {
  dataset: Dataset;
  stats: ColumnStat[];
}

type ChartType = 'histogram' | 'bar' | 'line' | 'scatter' | 'box' | 'correlation';

const CHART_TYPES: { id: ChartType; label: string; needsNumeric: boolean }[] = [
  { id: 'histogram', label: 'Histogram', needsNumeric: true },
  { id: 'bar', label: 'Bar Chart', needsNumeric: false },
  { id: 'line', label: 'Line Chart', needsNumeric: true },
  { id: 'scatter', label: 'Scatter', needsNumeric: true },
  { id: 'box', label: 'Box Plot', needsNumeric: true },
  { id: 'correlation', label: 'Correlation', needsNumeric: true },
];

export function ChartBuilder({ dataset, stats }: Props) {
  const numericCols = dataset.columns.filter((c) => c.type === 'number');
  const numericNames = numericCols.map((c) => c.name);

  const [chartType, setChartType] = useState<ChartType>('histogram');
  const [xCol, setXCol] = useState<string>(numericCols[0]?.name ?? '');
  const [yCol, setYCol] = useState<string>(numericCols[1]?.name ?? numericCols[0]?.name ?? '');
  const [bins, setBins] = useState(20);
  const [topN, setTopN] = useState(15);

  const allCols = dataset.columns;
  const availableChartTypes = CHART_TYPES.filter((ct) => {
    if (ct.id === 'correlation') return numericCols.length >= 2;
    if (ct.needsNumeric) return numericCols.length >= 1;
    return true;
  });

  // Auto-correct selection if chart type not available
  const effectiveChartType = availableChartTypes.some((c) => c.id === chartType) ? chartType : availableChartTypes[0]?.id ?? 'bar';

  const renderChart = () => {
    const xColumn = allCols.find((c) => c.name === xCol);
    const yColumn = allCols.find((c) => c.name === yCol);

    switch (effectiveChartType) {
      case 'histogram': {
        if (!xColumn) return <EmptyChart />;
        const values = getNumericValues(dataset, xColumn.index);
        if (values.length === 0) return <EmptyChart message="Selected column has no numeric values" />;
        return <Histogram data={values} bins={bins} />;
      }
      case 'bar': {
        if (!xColumn) return <EmptyChart />;
        if (xColumn.type === 'number') {
          const values = getNumericValues(dataset, xColumn.index);
          const counts = new Map<string, number>();
          for (const v of values) {
            const key = String(v);
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
          const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
          return <BarChart labels={sorted.map((s) => s[0])} values={sorted.map((s) => s[1])} horizontal={sorted.length > 8} />;
        }
        const values = dataset.rows.map((r) => (r[xColumn.index] === null ? null : String(r[xColumn.index])));
        const counts = new Map<string, number>();
        for (const v of values) {
          if (v === null) continue;
          counts.set(v, (counts.get(v) ?? 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
        if (sorted.length === 0) return <EmptyChart message="No data in selected column" />;
        return <BarChart labels={sorted.map((s) => s[0])} values={sorted.map((s) => s[1])} horizontal={sorted.length > 8} />;
      }
      case 'line': {
        if (!xColumn || !yColumn) return <EmptyChart message="Select two numeric columns" />;
        const { x, y } = getPairedNumeric(dataset, xColumn.index, yColumn.index);
        if (x.length < 2) return <EmptyChart message="Need at least 2 paired values" />;
        const indices = x.map((_, i) => i).sort((a, b) => x[a] - x[b]);
        const sx = indices.map((i) => x[i]);
        const sy = indices.map((i) => y[i]);
        return <LineChart x={sx} y={sy} xLabel={xCol} yLabel={yCol} />;
      }
      case 'scatter': {
        if (!xColumn || !yColumn) return <EmptyChart message="Select two numeric columns" />;
        const { x, y } = getPairedNumeric(dataset, xColumn.index, yColumn.index);
        if (x.length === 0) return <EmptyChart message="No paired numeric values" />;
        return <ScatterPlot x={x} y={y} xLabel={xCol} yLabel={yCol} />;
      }
      case 'box': {
        if (!xColumn) return <EmptyChart />;
        const values = getNumericValues(dataset, xColumn.index);
        if (values.length < 4) return <EmptyChart message="Need at least 4 values" />;
        return <BoxPlot values={values} label={xCol} />;
      }
      case 'correlation': {
        if (numericCols.length < 2) return <EmptyChart message="Need at least 2 numeric columns" />;
        const matrix = numericCols.map((a) =>
          numericCols.map((b) => {
            if (a.index === b.index) return 1;
            const { x, y } = getPairedNumeric(dataset, a.index, b.index);
            return pearsonCorrelation(x, y);
          })
        );
        return <CorrelationMatrix columns={numericNames} matrix={matrix} />;
      }
      default:
        return null;
    }
  };

  const showXCol = effectiveChartType !== 'correlation';
  const showYCol = effectiveChartType === 'line' || effectiveChartType === 'scatter';
  const showBins = effectiveChartType === 'histogram';
  const showTopN = effectiveChartType === 'bar';

  const getSelectableColumns = (axis: 'x' | 'y'): typeof allCols => {
    if (effectiveChartType === 'histogram' || effectiveChartType === 'box') {
      return numericCols;
    }
    if (effectiveChartType === 'bar') {
      return allCols;
    }
    if (effectiveChartType === 'line' || effectiveChartType === 'scatter') {
      return numericCols;
    }
    return allCols;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Chart Builder</h2>
        <p className="text-sm text-slate-500">Select chart type and columns to visualize your data</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {availableChartTypes.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setChartType(ct.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                effectiveChartType === ct.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {showXCol && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {effectiveChartType === 'scatter' || effectiveChartType === 'line' ? 'X Axis' : effectiveChartType === 'bar' ? 'Category' : 'Column'}
              </label>
              <select
                value={xCol}
                onChange={(e) => setXCol(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
              >
                {getSelectableColumns('x').map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          )}
          {showYCol && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Y Axis</label>
              <select
                value={yCol}
                onChange={(e) => setYCol(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
              >
                {getSelectableColumns('y').map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {showBins && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Bins: {bins}</label>
              <input
                type="range"
                min={5}
                max={50}
                value={bins}
                onChange={(e) => setBins(Number(e.target.value))}
                className="w-32 accent-blue-600"
              />
            </div>
          )}
          {showTopN && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Top N: {topN}</label>
              <input
                type="range"
                min={5}
                max={30}
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="w-32 accent-blue-600"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        {renderChart()}
      </div>

      {effectiveChartType === 'scatter' && (
        <CorrelationSummary dataset={dataset} xCol={xCol} yCol={yCol} allCols={allCols} />
      )}
    </div>
  );
}

function EmptyChart({ message = 'Select columns to generate a chart' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center text-slate-400 text-sm h-[300px]">{message}</div>
  );
}

function CorrelationSummary({ dataset, xCol, yCol, allCols }: { dataset: Dataset; xCol: string; yCol: string; allCols: Dataset['columns'] }) {
  const xColumn = allCols.find((c) => c.name === xCol);
  const yColumn = allCols.find((c) => c.name === yCol);
  if (!xColumn || !yColumn) return null;
  const { x, y } = getPairedNumeric(dataset, xColumn.index, yColumn.index);
  const r = pearsonCorrelation(x, y);
  const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : Math.abs(r) > 0.2 ? 'weak' : 'negligible';
  const direction = r > 0 ? 'positive' : 'negative';

  return (
    <div className="bg-blue-50 rounded-lg p-4 text-sm text-slate-700">
      <span className="font-semibold">Pearson r = {isNaN(r) ? '—' : r.toFixed(4)}</span>
      {!isNaN(r) && (
        <span className="text-slate-500"> · {strength} {direction} correlation between {xCol} and {yCol} ({x.length} paired values)</span>
      )}
    </div>
  );
}

// Keep quantile import reference alive for potential box plot stats display
void quantile;
