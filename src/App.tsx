import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Dataset, ColumnStat, DataQualityReport } from '@/lib/types';
import { parseCSV, buildDataset } from '@/lib/csvParser';
import { computeColumnStats } from '@/lib/stats';
import { computeDataQuality } from '@/lib/quality';
import { saveDataset, loadDataset } from '@/lib/storage';
import { Sidebar, type ViewId } from '@/components/Sidebar';
import { FileUpload } from '@/components/FileUpload';
import { Overview } from '@/components/Overview';
import { ColumnStats } from '@/components/ColumnStats';
import { DataQuality } from '@/components/DataQuality';
import { DataTable } from '@/components/DataTable';
import { ChartBuilder } from '@/components/ChartBuilder';
import { BarChart3, Moon, Sun } from 'lucide-react';

function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [view, setView] = useState<ViewId>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('datalens-theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('datalens-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleFile = useCallback(async (file: File, text: string) => {
    setLoading(true);
    setError(null);
    try {
      // Yield to UI before potentially heavy parse
      await new Promise((r) => setTimeout(r, 0));
      const rawRows = parseCSV(text);
      if (rawRows.length < 2) {
        setError('CSV must have a header row and at least one data row.');
        setLoading(false);
        return;
      }
      const ds = buildDataset(rawRows, file.name);
      if (ds.columns.length === 0) {
        setError('No columns detected in this CSV file.');
        setLoading(false);
        return;
      }
      setDataset(ds);
      saveDataset(ds);
      setView('overview');
    } catch {
      setError('Failed to parse the CSV file. Please check the file format.');
    }
    setLoading(false);
  }, []);

  const handleSwitchDataset = useCallback((id: string) => {
    const ds = loadDataset(id);
    if (ds) {
      setDataset(ds);
      setView('overview');
    }
  }, []);

  const handleClear = useCallback(() => {
    setDataset(null);
    setView('overview');
  }, []);

  const stats: ColumnStat[] = useMemo(() => {
    if (!dataset) return [];
    return computeColumnStats(dataset);
  }, [dataset]);

  const qualityReport: DataQualityReport | null = useMemo(() => {
    if (!dataset) return null;
    return computeDataQuality(dataset, stats);
  }, [dataset, stats]);

  return (
    <div className={`min-h-screen bg-slate-50 flex ${darkMode ? 'theme-dark' : ''}`}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setDarkMode((current) => !current)}
        aria-pressed={darkMode}
        aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{darkMode ? 'Light' : 'Dark'}</span>
      </button>
      <Sidebar
        dataset={dataset}
        currentView={view}
        onViewChange={setView}
        onFile={handleFile}
        onSwitchDataset={handleSwitchDataset}
        onClearDataset={handleClear}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {!dataset ? (
          <div className="min-h-screen flex items-center justify-center px-6 py-12">
            <div className="max-w-2xl w-full">
              {loading && (
                <div className="mb-4 flex items-center justify-center gap-2 text-blue-600">
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium">Parsing your CSV...</span>
                </div>
              )}
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}
              <div className="text-center mb-8">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-200 mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">DataLens</h1>
                <p className="text-slate-500 max-w-md mx-auto">
                  Upload a CSV file to explore your data with interactive statistics, charts, and quality reports — all processed right in your browser.
                </p>
              </div>
              <FileUpload onFile={handleFile} />
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <FeatureBadge label="Statistics" />
                <FeatureBadge label="6 Chart Types" />
                <FeatureBadge label="Quality Reports" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                {error}
              </div>
            )}
            {view === 'overview' && <Overview dataset={dataset} />}
            {view === 'columns' && <ColumnStats stats={stats} />}
            {view === 'quality' && qualityReport && <DataQuality report={qualityReport} />}
            {view === 'charts' && <ChartBuilder dataset={dataset} stats={stats} />}
            {view === 'table' && <DataTable dataset={dataset} />}
          </div>
        )}
      </main>
      <a
        className="ravenick-badge"
        href="https://github.com/Ravenick"
        target="_blank"
        rel="noreferrer"
        aria-label="Built by Ravenick, Nelson Emmanuel"
      >
        <span className="ravenick-badge__sheen" aria-hidden="true" />
        <img src="/oc-logo-no-bg.png" alt="" className="ravenick-badge__logo" />
        <span className="ravenick-badge__copy">
          <span className="ravenick-badge__built">Built by</span>
          <span className="ravenick-badge__name">Ravenick</span>
        </span>
      </a>
    </div>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3">
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}

export default App;
