// src/tools/pdf/organize/PdfOrganizeView.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Undo2, 
  LayoutGrid,
  GripVertical
} from 'lucide-react';
import { loadPdfPagesForOrganize, saveOrganizedPdf, formatBytes } from './engine';
import type { OrganizePageItem, OrganizeResult } from './engine';

export const PdfOrganizeView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [initialPages, setInitialPages] = useState<OrganizePageItem[]>([]);
  const [pages, setPages] = useState<OrganizePageItem[]>([]);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [result, setResult] = useState<OrganizeResult | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    setLoadingPages(true);
    setLoadingProgress('Reading pages...');
    setResult(null);

    try {
      const loaded = await loadPdfPagesForOrganize(incomingFile, (curr, total) => {
        setLoadingProgress(`Loading page previews (${curr}/${total})...`);
      });
      setInitialPages(loaded);
      setPages(loaded);
    } catch (err) {
      console.error(err);
      alert('Failed to read PDF pages.');
      setFile(null);
    } finally {
      setLoadingPages(false);
      setLoadingProgress('');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setPages((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
    setResult(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const movePageLeft = (index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
    setResult(null);
  };

  const movePageRight = (index: number) => {
    if (index === pages.length - 1) return;
    setPages((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
    setResult(null);
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) {
      alert('The PDF must contain at least one page.');
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
    setResult(null);
  };

  const handleReset = () => {
    setPages([...initialPages]);
    setResult(null);
  };

  const handleSave = async () => {
    if (!file) return;

    setSaving(true);
    try {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
      const res = await saveOrganizedPdf(file, pages);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save organized PDF.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `${baseName}-organized.pdf`;
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
            Upload PDF to Organize Pages
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Drag and drop pages to rearrange, swap sequences, or remove unwanted pages visually.
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
                  {formatBytes(file.size)} • Remaining: <strong className="text-slate-700 dark:text-slate-200">{pages.length} of {initialPages.length} pages</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPages([]);
                setInitialPages([]);
                setResult(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {/* Loader */}
          {loadingPages && (
            <div className="p-12 text-center space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {loadingProgress || 'Rendering pages...'}
              </p>
            </div>
          )}

          {!loadingPages && pages.length > 0 && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-sky-500" /> Page Sequence ({pages.length})
                  </span>
                  <span className="hidden sm:inline-block text-[11px] text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-2">
                    💡 Tip: Drag and drop cards to reorder
                  </span>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Reset Order
                </button>
              </div>

              {/* Pages Grid with Drag and Drop Support */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((item, idx) => {
                  const isBeingDragged = draggedIndex === idx;
                  const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex flex-col items-center p-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm relative group cursor-grab active:cursor-grabbing transition-all select-none ${
                        isBeingDragged ? 'opacity-30 scale-95 border-sky-400 border-dashed' : ''
                      } ${
                        isDropTarget
                          ? 'border-sky-500 ring-2 ring-sky-500/40 -translate-y-1 bg-sky-50/20 dark:bg-sky-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
                      }`}
                    >
                      {/* Header Badges */}
                      <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                          Pos #{idx + 1}
                        </span>
                        <span className="text-slate-400 flex items-center gap-0.5 text-[10px] font-normal">
                          <GripVertical className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          <span>Orig #{item.originalIndex + 1}</span>
                        </span>
                      </div>

                      {/* Real Page Preview Thumbnail */}
                      <div className="w-full h-44 rounded-lg bg-slate-100 dark:bg-slate-950/60 p-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 pointer-events-none">
                        <img
                          src={item.thumbnailUrl}
                          alt={`Page ${item.originalIndex + 1}`}
                          className="max-h-full max-w-full object-contain shadow-sm pointer-events-none"
                        />
                      </div>

                      {/* Controls (Arrows & Delete) */}
                      <div className="w-full flex items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            movePageLeft(idx);
                          }}
                          disabled={idx === 0}
                          title="Move Left"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(item.id);
                          }}
                          title="Delete this page"
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-950/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            movePageRight(idx);
                          }}
                          disabled={idx === pages.length - 1}
                          title="Move Right"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Action */}
              {!result && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating Organized PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" /> Save & Download Organized PDF ({pages.length} Pages)
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
                        PDF Organized Successfully!
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Saved with {result.pageCount} pages in custom order ({formatBytes(result.size)}).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleDownload}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Organized PDF
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Rearrange More
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