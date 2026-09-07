// src/tools/pdf/merge/PdfMergeView.tsx
import { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  RefreshCw, 
  Plus, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import { mergePdfFiles, getPdfPageCount, formatBytes } from './engine';
import type { PDFFileInfo, MergeResult } from './engine';

export const PdfMergeView = () => {
  const [files, setFiles] = useState<PDFFileInfo[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<MergeResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = async (incomingFiles: FileList | File[]) => {
    const validPdfFiles: File[] = Array.from(incomingFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (validPdfFiles.length === 0) {
      alert('Please upload valid PDF files.');
      return;
    }

    const newEntries: PDFFileInfo[] = [];
    for (const file of validPdfFiles) {
      try {
        const pages = await getPdfPageCount(file);
        newEntries.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          pageCount: pages,
        });
      } catch (err) {
        console.error('Error reading PDF:', err);
        newEntries.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
        });
      }
    }

    setFiles((prev) => [...prev, ...newEntries]);
    setResult(null); // Reset previous merge output
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResult(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to combine.');
      return;
    }

    setIsMerging(true);
    setProgress(0);

    try {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
      const res = await mergePdfFiles(
        files.map((f) => f.file),
        (p) => setProgress(p)
      );
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF Merge failed');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `merged-document-${Date.now()}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* File Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
          accept="application/pdf"
          multiple
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-3 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
          Drop PDF files here or click to browse
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select multiple files to merge in your preferred sequence. 100% private in-browser execution.
        </p>
      </div>

      {/* Selected Files List & Sorting */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Files to Merge ({files.length})
            </h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add more PDFs
            </button>
          </div>

          <div className="space-y-2">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(item.size)} {item.pageCount ? `• ${item.pageCount} pages` : ''}
                    </p>
                  </div>
                </div>

                {/* Reorder and Delete Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === files.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    title="Remove"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Trigger Button */}
          {!result && (
            <div className="pt-2">
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || isMerging}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                {isMerging ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Merging Documents ({progress}%)...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" /> Merge {files.length} PDF Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Result Box */}
      {result && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                PDFs Merged Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Combined document contains {result.totalPages} total pages ({formatBytes(result.totalSize)}).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4" /> Download Merged PDF
            </button>
            <button
              onClick={() => {
                setFiles([]);
                setResult(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};