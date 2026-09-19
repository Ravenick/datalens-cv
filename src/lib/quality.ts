import type { Dataset, DataQualityReport, DataQualityIssue } from './types';
import { getNumericValues, quantile } from './stats';

export function computeDataQuality(dataset: Dataset, columnStats: ReturnType<typeof import('./stats').computeColumnStats>): DataQualityReport {
  const totalRows = dataset.rows.length;
  const totalCells = totalRows * dataset.columns.length;
  const issues: DataQualityIssue[] = [];

  let missingCells = 0;
  let duplicateCount = 0;

  // Missing cells per column
  dataset.columns.forEach((col) => {
    const missing = dataset.rows.filter((r) => r[col.index] === null).length;
    missingCells += missing;
    if (missing > 0) {
      const pct = (missing / totalRows) * 100;
      const severity = pct > 50 ? 'critical' : pct > 20 ? 'warning' : 'info';
      issues.push({
        severity,
        category: 'Missing values',
        message: `${missing} missing value${missing > 1 ? 's' : ''} (${pct.toFixed(1)}%)`,
        column: col.name,
      });
    }
  });

  // Duplicate rows
  const seen = new Set<string>();
  for (const row of dataset.rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicateCount++;
    } else {
      seen.add(key);
    }
  }
  if (duplicateCount > 0) {
    issues.push({
      severity: duplicateCount > totalRows * 0.1 ? 'warning' : 'info',
      category: 'Duplicates',
      message: `${duplicateCount} duplicate row${duplicateCount > 1 ? 's' : ''} detected`,
    });
  }

  // Outliers via IQR on numeric columns
  columnStats.forEach((stat) => {
    if (!stat.numeric || stat.numeric.count < 4) return;
    const values = getNumericValues(dataset, dataset.columns.findIndex((c) => c.name === stat.name));
    if (values.length < 4) return;
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const outliers = values.filter((v) => v < lower || v > upper);
    if (outliers.length > 0) {
      const pct = (outliers.length / values.length) * 100;
      const severity = pct > 10 ? 'warning' : 'info';
      issues.push({
        severity,
        category: 'Outliers',
        message: `${outliers.length} potential outlier${outliers.length > 1 ? 's' : ''} (${pct.toFixed(1)}%) outside 1.5×IQR range`,
        column: stat.name,
      });
    }
  });

  // Constant columns
  columnStats.forEach((stat) => {
    if (stat.categorical && stat.categorical.unique === 1) {
      issues.push({
        severity: 'info',
        category: 'Low variance',
        message: 'Column has only one unique value',
        column: stat.name,
      });
    }
  });

  return {
    totalRows,
    totalCells,
    missingCells,
    missingPercent: totalCells > 0 ? (missingCells / totalCells) * 100 : 0,
    duplicateRows: duplicateCount,
    issues,
  };
}
