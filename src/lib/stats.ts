import type { Dataset, ColumnStat, NumericStats, CategoricalStats } from './types';

export function getNumericValues(dataset: Dataset, colIndex: number): number[] {
  const values: number[] = [];
  for (const row of dataset.rows) {
    const v = row[colIndex];
    if (typeof v === 'number' && !isNaN(v)) values.push(v);
  }
  return values;
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function computeNumericStats(values: number[], totalRows: number): NumericStats {
  const count = values.length;
  const missing = totalRows - count;
  if (count === 0) {
    return { count: 0, missing, mean: NaN, median: NaN, min: NaN, max: NaN, std: NaN, q1: NaN, q3: NaN, iqr: NaN };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median = quantile(sorted, 0.5);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / count;
  const std = Math.sqrt(variance);
  return {
    count,
    missing,
    mean,
    median,
    min: sorted[0],
    max: sorted[count - 1],
    std,
    q1,
    q3,
    iqr: q3 - q1,
  };
}

export function computeCategoricalStats(values: (string | null)[], totalRows: number): CategoricalStats {
  const counts = new Map<string, number>();
  let nonNull = 0;
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    nonNull++;
  }
  const top = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  return { count: nonNull, missing: totalRows - nonNull, unique: counts.size, top };
}

export function computeColumnStats(dataset: Dataset): ColumnStat[] {
  return dataset.columns.map((col) => {
    const stat: ColumnStat = { name: col.name, type: col.type };
    if (col.type === 'number') {
      stat.numeric = computeNumericStats(getNumericValues(dataset, col.index), dataset.rows.length);
    } else {
      const values = dataset.rows.map((r) => {
        const v = r[col.index];
        return v === null ? null : String(v);
      });
      stat.categorical = computeCategoricalStats(values, dataset.rows.length);
    }
    return stat;
  });
}

/** Pearson correlation between two numeric columns. */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return NaN;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? NaN : num / den;
}

/** Get aligned (non-missing) pairs for two numeric columns. */
export function getPairedNumeric(dataset: Dataset, colA: number, colB: number): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (const row of dataset.rows) {
    const a = row[colA];
    const b = row[colB];
    if (typeof a === 'number' && !isNaN(a) && typeof b === 'number' && !isNaN(b)) {
      x.push(a);
      y.push(b);
    }
  }
  return { x, y };
}
