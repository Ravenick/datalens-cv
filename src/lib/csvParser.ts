import type { ColumnMeta, ColumnType, Dataset } from './types';

/** Parse a CSV string into rows of raw string fields. Handles quoted fields and embedded delimiters/quotes/newlines. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  // Normalize line endings, strip BOM
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }
  // Last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Remove fully empty trailing rows
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === '')) {
    rows.pop();
  }
  return rows;
}

function inferType(values: string[]): ColumnType {
  let numericCount = 0;
  let boolCount = 0;
  let dateCount = 0;
  let nonEmpty = 0;

  for (const raw of values) {
    const v = raw.trim();
    if (v === '') continue;
    nonEmpty++;
    if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(v)) {
      numericCount++;
    } else if (v.toLowerCase() === 'true' || v.toLowerCase() === 'false') {
      boolCount++;
    } else if (!isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v)) {
      dateCount++;
    }
  }

  if (nonEmpty === 0) return 'string';
  if (numericCount / nonEmpty >= 0.8) return 'number';
  if (boolCount / nonEmpty >= 0.8) return 'boolean';
  if (dateCount / nonEmpty >= 0.8) return 'date';
  return 'string';
}

/** Convert raw string fields into typed values based on inferred column types. */
export function buildDataset(rawRows: string[][], name: string): Dataset {
  if (rawRows.length === 0) {
    return { id: crypto.randomUUID(), name, columns: [], rows: [], createdAt: Date.now() };
  }

  const header = rawRows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
  const body = rawRows.slice(1);

  // Sample for type inference (use up to 1000 rows for speed)
  const sampleSize = Math.min(body.length, 1000);
  const columns: ColumnMeta[] = header.map((h, idx) => {
    const sample = body.slice(0, sampleSize).map((r) => r[idx] ?? '');
    return { name: h, type: inferType(sample), index: idx };
  });

  // Deduplicate column names
  const seen = new Map<string, number>();
  columns.forEach((c) => {
    if (seen.has(c.name)) {
      const n = seen.get(c.name)! + 1;
      seen.set(c.name, n);
      c.name = `${c.name}_${n}`;
    } else {
      seen.set(c.name, 1);
    }
  });

  const rows = body.map((rawRow) =>
    columns.map((col) => {
      const raw = (rawRow[col.index] ?? '').trim();
      if (raw === '') return null;
      switch (col.type) {
        case 'number': {
          const n = parseFloat(raw);
          return isNaN(n) ? null : n;
        }
        case 'boolean': {
          const lower = raw.toLowerCase();
          if (lower === 'true') return 1;
          if (lower === 'false') return 0;
          return null;
        }
        default:
          return raw;
      }
    })
  );

  return {
    id: crypto.randomUUID(),
    name,
    columns,
    rows,
    createdAt: Date.now(),
  };
}
