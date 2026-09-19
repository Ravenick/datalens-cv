import { useState, useMemo, useRef, useEffect } from 'react';
import type { Dataset } from '@/lib/types';
import { formatNumber } from '@/lib/chartUtils';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportCSV } from '@/lib/export';

interface Props {
  dataset: Dataset;
}

const PAGE_SIZE = 50;

export function DataTable({ dataset }: Props) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset page when query changes
  useEffect(() => { setPage(0); }, [query]);

  const filtered = useMemo(() => {
    if (!query.trim()) return dataset.rows.map((r, i) => ({ row: r, index: i }));
    const q = query.toLowerCase();
    const result: { row: (string | number | null)[]; index: number }[] = [];
    for (let i = 0; i < dataset.rows.length; i++) {
      const row = dataset.rows[i];
      if (row.some((v) => v !== null && String(v).toLowerCase().includes(q))) {
        result.push({ row, index: i });
      }
    }
    return result;
  }, [dataset, query]);

  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const av = a.row[sortCol];
      const bv = b.row[sortCol];
      if (av === null && bv === null) return 0;
      if (av === null) return sortDir === 'asc' ? 1 : -1;
      if (bv === null) return sortDir === 'asc' ? -1 : 1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (colIndex: number) => {
    if (sortCol === colIndex) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colIndex);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    exportCSV(dataset, (row, i) => {
      const found = sorted.find((s) => s.index === i);
      return found !== undefined;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Data Explorer</h2>
          <p className="text-sm text-slate-500">
            {sorted.length.toLocaleString()} of {dataset.rows.length.toLocaleString()} rows
            {query && ' match your search'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rows..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div ref={containerRef} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 sticky left-0 bg-slate-50 z-10">#</th>
                {dataset.columns.map((col) => (
                  <th
                    key={col.index}
                    onClick={() => toggleSort(col.index)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-slate-900 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        {sortCol === col.index ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(({ row, index }) => (
                <tr key={index} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-3 py-2 text-xs text-slate-400 tabular-nums sticky left-0 bg-white z-10">{index + 1}</td>
                  {dataset.columns.map((col) => {
                    const v = row[col.index];
                    return (
                      <td key={col.index} className="px-4 py-2 whitespace-nowrap">
                        {v === null ? (
                          <span className="text-slate-300 italic text-xs">missing</span>
                        ) : col.type === 'number' ? (
                          <span className="tabular-nums text-slate-700">{formatNumber(v as number)}</span>
                        ) : (
                          <span className="text-slate-700 truncate max-w-xs block">{String(v)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={dataset.columns.length + 1} className="px-4 py-12 text-center text-sm text-slate-400">
                    No rows match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {page + 1} of {totalPages} · Showing {pageRows.length} rows
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
