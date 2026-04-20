import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, Download } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ImportResult } from '@/types/models';

interface CsvImportProps {
  entityType: 'investor' | 'partner';
  onImport: (file: File) => Promise<ImportResult>;
  onSuccess: () => void;
  templateHeaders: string[];
}

export function CsvImport({ entityType, onImport, onSuccess, templateHeaders }: CsvImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: async (f: File) => {
      const res = await onImport(f);
      return res;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    Papa.parse<string[]>(f, {
      header: false,
      preview: 6,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length < 1) return;
        setPreview({
          headers: rows[0] ?? [],
          rows: rows.slice(1),
        });
      },
    });
  };

  const handleImport = async () => {
    if (!file) return;
    await mutateAsync(file);
    // result is shown in-modal; user clicks Done to close
  };

  const downloadTemplate = () => {
    const csv = templateHeaders.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}-import-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Upload a CSV file to bulk import {entityType}s. Download the template to see the
          expected column format.
        </p>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 flex-shrink-0 ml-4">
          <Download size={14} />
          Template
        </Button>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) {
            setFile(f);
            const input = inputRef.current;
            if (input) {
              const dt = new DataTransfer();
              dt.items.add(f);
              input.files = dt.files;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        {file ? (
          <div>
            <p className="font-medium text-gray-700 text-sm">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(file.size / 1024).toFixed(1)} KB — click to change
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-gray-700 text-sm">Click to upload or drag & drop</p>
            <p className="text-xs text-gray-400 mt-1">CSV files only</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-600">
              Preview (first {preview.rows.length} rows)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-700 max-w-[140px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isError && (
        <Alert variant="error" title="Import failed">
          Could not upload the file. Please try again.
        </Alert>
      )}

      {result && (
        <>
          <Alert variant={result.errors.length + result.parseErrors.length > 0 ? 'warning' : 'success'} title="Import complete">
            <ul className="mt-1 space-y-0.5 text-sm">
              <li>✅ {result.created} created</li>
              <li>🔄 {result.updated} updated</li>
              {result.errors.length + result.parseErrors.length > 0 && (
                <li>⚠️ {result.errors.length + result.parseErrors.length} rows skipped — check your data</li>
              )}
            </ul>
          </Alert>
          <div className="flex justify-end">
            <Button onClick={onSuccess}>Done</Button>
          </div>
        </>
      )}

      {file && !result && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setFile(null); setPreview(null); }}>
            Clear
          </Button>
          <Button onClick={handleImport} loading={isPending}>
            Import {entityType}s
          </Button>
        </div>
      )}
    </div>
  );
}
