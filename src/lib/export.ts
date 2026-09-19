import type { Dataset } from './types';

/** Convert dataset to CSV string, with proper quoting. */
export function datasetToCSV(dataset: Dataset, rowFilter?: (row: (string | number | null)[], index: number) => boolean): string {
  const header = dataset.columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',');
  const lines = [header];
  dataset.rows.forEach((row, i) => {
    if (rowFilter && !rowFilter(row, i)) return;
    const fields = row.map((v) => {
      if (v === null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    });
    lines.push(fields.join(','));
  });
  return lines.join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV(dataset: Dataset, rowFilter?: (row: (string | number | null)[], index: number) => boolean): void {
  const csv = datasetToCSV(dataset, rowFilter);
  downloadFile(`${dataset.name.replace(/\.[^.]+$/, '')}_export.csv`, csv, 'text/csv');
}
