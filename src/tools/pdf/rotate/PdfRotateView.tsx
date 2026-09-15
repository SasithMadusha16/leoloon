import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  RotateCw, 
  RotateCcw, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Undo2 
} from 'lucide-react';
import { renderPageThumbnails, rotatePdf, formatBytes } from './engine';
import type { RotateResult } from './engine';

export const PdfRotateView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [rotations, setRotations] = useState<number[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(false);
  const [thumbnailProgress, setThumbnailProgress] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [result, setResult] = useState<RotateResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    };
  }, [result]);

  const handleFileSelect = async (incomingFile: File) => {
    if (incomingFile.type !== 'application/pdf' && !incomingFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setFile(incomingFile);
    setLoadingThumbnails(true);
    setThumbnailProgress('Reading document...');
    setResult(null);

    try {
      const thumbs = await renderPageThumbnails(incomingFile, (curr, total) => {
        setThumbnailProgress(`Rendering previews (${curr}/${total})...`);
      });
      setThumbnails(thumbs);
      setRotations(new Array(thumbs.length).fill(0));
    } catch (err) {
      console.error(err);
      alert('Failed to load PDF pages. Ensure it is not encrypted.');
      setFile(null);
    } finally {
      setLoadingThumbnails(false);
      setThumbnailProgress('');
    }
  };

  const rotateSinglePage = (index: number) => {
    setRotations((prev) => {
      const updated = [...prev];
      updated[index] = (updated[index] + 90) % 360;
      return updated;
    });
    setResult(null);
  };

  const rotateAllClockwise = () => {
    setRotations((prev) => prev.map((deg) => (deg + 90) % 360));
    setResult(null);
  };

  const rotateAllCounterClockwise = () => {
    setRotations((prev) => prev.map((deg) => (deg + 270) % 360));
    setResult(null);
  };

  const handleReset = () => {
    setRotations(new Array(thumbnails.length).fill(0));
    setResult(null);
  };

  const handleApplyRotation = async () => {
    if (!file) return;

    setSaving(true);
    try {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
      const res = await rotatePdf(file, rotations);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rotation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `${baseName}-rotated.pdf`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept="application/pdf"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload PDF to Rotate Pages
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Inspect real page previews and rotate individual pages or the entire document smoothly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} • Total: <strong className="text-slate-700 dark:text-slate-200">{thumbnails.length} pages</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setThumbnails([]);
                setRotations([]);
                setResult(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {/* Rendering Spinner */}
          {loadingThumbnails && (
            <div className="p-12 text-center space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {thumbnailProgress || 'Loading page previews...'}
              </p>
            </div>
          )}

          {!loadingThumbnails && thumbnails.length > 0 && (
            <>
              {/* Bulk Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">Rotate All:</span>
                  <button
                    onClick={rotateAllClockwise}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-sky-500" /> Right (+90°)
                  </button>
                  <button
                    onClick={rotateAllCounterClockwise}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-500" /> Left (-90°)
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Reset All
                </button>
              </div>

              {/* Page Rotation Grid with Real Visual Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {thumbnails.map((src, idx) => {
                  const deg = rotations[idx] || 0;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-sky-500/50 transition-all"
                    >
                      <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                        <span>Page {idx + 1}</span>
                        <span className={`font-mono text-[10px] ${deg !== 0 ? 'text-sky-500 font-bold' : 'text-slate-400'}`}>
                          {deg}°
                        </span>
                      </div>

                      {/* Real Page Image with Smooth CSS Rotation */}
                      <div className="w-full h-44 rounded-lg bg-slate-100 dark:bg-slate-950/60 p-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800/80">
                        <img
                          src={src}
                          alt={`Page ${idx + 1}`}
                          style={{ transform: `rotate(${deg}deg)` }}
                          className="max-h-full max-w-full object-contain shadow-sm transition-transform duration-300 ease-in-out"
                        />
                      </div>

                      <button
                        onClick={() => rotateSinglePage(idx)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/50 dark:hover:text-sky-400 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <RotateCw className="w-3 h-3" /> Rotate 90°
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {!result && (
                <button
                  onClick={handleApplyRotation}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving Rotated PDF...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4" /> Save & Download Rotated PDF
                    </>
                  )}
                </button>
              )}

              {/* Success Result */}
              {result && (
                <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Rotated Successfully!
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Saved with new page angles permanently ({formatBytes(result.size)}).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleDownload}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Rotated PDF
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Change Angles
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};