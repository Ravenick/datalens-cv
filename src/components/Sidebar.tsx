import type { Dataset } from '@/lib/types';
import { BarChart3, LayoutDashboard, Table2, ShieldCheck, TrendingUp, Upload, Clock, X, Trash2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { listSavedDatasets, deleteDataset, type SavedDatasetMeta } from '@/lib/storage';
import { useState, useEffect } from 'react';
import { formatBytes } from '@/lib/format';

export type ViewId = 'overview' | 'columns' | 'quality' | 'charts' | 'table';

interface Props {
  dataset: Dataset | null;
  currentView: ViewId;
  onViewChange: (v: ViewId) => void;
  onFile: (file: File, text: string) => void;
  onSwitchDataset: (id: string) => void;
  onClearDataset: () => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'columns', label: 'Column Stats', icon: BarChart3 },
  { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
  { id: 'charts', label: 'Charts', icon: TrendingUp },
  { id: 'table', label: 'Data Table', icon: Table2 },
];

export function Sidebar({ dataset, currentView, onViewChange, onFile, onSwitchDataset, onClearDataset }: Props) {
  const [saved, setSaved] = useState<SavedDatasetMeta[]>([]);

  useEffect(() => {
    setSaved(listSavedDatasets());
  }, [dataset]);

  const handleDelete = (id: string) => {
    deleteDataset(id);
    setSaved(listSavedDatasets());
  };

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">DataLens</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">CSV Analytics</p>
          </div>
        </div>
      </div>

      {/* Current dataset */}
      {dataset && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Current Dataset</p>
              <p className="text-sm font-semibold text-slate-700 truncate" title={dataset.name}>{dataset.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{dataset.rows.length.toLocaleString()} rows · {dataset.columns.length} cols</p>
            </div>
            <button
              onClick={onClearDataset}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Close dataset"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-3 py-3 flex-1 overflow-y-auto">
        {dataset && (
          <div className="space-y-0.5 mb-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Upload */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-1.5">
            <Upload className="h-3 w-3" /> Upload
          </p>
          <FileUpload onFile={onFile} compact />
        </div>

        {/* Recent */}
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Recent Datasets
          </p>
          {saved.length === 0 ? (
            <p className="text-xs text-slate-400 px-3">No saved datasets yet</p>
          ) : (
            <div className="space-y-0.5">
              {saved.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => onSwitchDataset(s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.rows.toLocaleString()} rows · {formatBytes(s.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">All data processed locally</p>
      </div>
    </aside>
  );
}
