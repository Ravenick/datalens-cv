import type { DataQualityReport } from '@/lib/types';
import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  report: DataQualityReport;
}

export function DataQuality({ report }: Props) {
  const hasIssues = report.issues.length > 0 || report.missingCells > 0 || report.duplicateRows > 0;

  const critical = report.issues.filter((i) => i.severity === 'critical');
  const warnings = report.issues.filter((i) => i.severity === 'warning');
  const infos = report.issues.filter((i) => i.severity === 'info');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Data Quality Report</h2>
        <p className="text-sm text-slate-500">Missing values, duplicates, and outlier detection</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Cells</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{report.totalCells.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Missing Cells</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{report.missingCells.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{report.missingPercent.toFixed(1)}% of total</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Duplicate Rows</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{report.duplicateRows.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overall</p>
          {hasIssues ? (
            <div className="flex items-center gap-2">
              {critical.length > 0 ? <AlertCircle className="h-6 w-6 text-rose-500" /> : <AlertTriangle className="h-6 w-6 text-amber-500" />}
              <span className="text-lg font-bold text-slate-800">{critical.length > 0 ? 'Needs attention' : 'Minor issues'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <span className="text-lg font-bold text-slate-800">Clean</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Detailed Findings ({report.issues.length})</h3>
        </div>
        {report.issues.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
            <p className="text-sm text-slate-600">No data quality issues detected. Your dataset looks clean.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {critical.map((issue, i) => <IssueRow key={`c${i}`} issue={issue} />)}
            {warnings.map((issue, i) => <IssueRow key={`w${i}`} issue={issue} />)}
            {infos.map((issue, i) => <IssueRow key={`i${i}`} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: DataQualityReport['issues'][number] }) {
  const config = {
    critical: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Critical' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Warning' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Info' },
  };
  const c = config[issue.severity];
  const Icon = c.icon;

  return (
    <div className="px-5 py-3.5 flex items-start gap-3">
      <div className={`shrink-0 w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${c.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{issue.category}</span>
          {issue.column && (
            <>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-600 truncate">{issue.column}</span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-700">{issue.message}</p>
      </div>
    </div>
  );
}
