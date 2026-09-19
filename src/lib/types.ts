export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  index: number;
}

export interface Dataset {
  id: string;
  name: string;
  columns: ColumnMeta[];
  rows: (string | number | null)[][];
  createdAt: number;
}

export interface NumericStats {
  count: number;
  missing: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface CategoricalStats {
  count: number;
  missing: number;
  unique: number;
  top: { value: string; count: number }[];
}

export interface ColumnStat {
  name: string;
  type: ColumnType;
  numeric?: NumericStats;
  categorical?: CategoricalStats;
}

export interface DataQualityIssue {
  severity: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  column?: string;
}

export interface DataQualityReport {
  totalRows: number;
  totalCells: number;
  missingCells: number;
  missingPercent: number;
  duplicateRows: number;
  issues: DataQualityIssue[];
}
