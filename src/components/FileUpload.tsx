import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

interface Props {
  onFile: (file: File, text: string) => void;
  compact?: boolean;
}

export function FileUpload({ onFile, compact = false }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        onFile(file, text);
      };
      reader.readAsText(file);
    },
    [onFile]
  );

  if (compact) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        className={`rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <UploadCloud className="mx-auto h-6 w-6 text-slate-400 mb-1" />
        <p className="text-xs text-slate-500">Drop a CSV or click to upload</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 hover:border-slate-400 bg-white'}`}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Upload a CSV file</h3>
      <p className="text-sm text-slate-500">Drag and drop your file here, or click to browse</p>
      <p className="text-xs text-slate-400 mt-2">Everything is processed locally in your browser — no data leaves your device</p>
    </div>
  );
}
