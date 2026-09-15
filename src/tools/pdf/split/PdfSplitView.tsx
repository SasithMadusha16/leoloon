import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Scissors, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Eye
} from 'lucide-react';
import { getPdfDetails, parsePageRanges, extractPdfPages, formatBytes } from './engine';
import type { PDFSplitResult } from './engine';

export const PdfSplitView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PDFSplitResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview URL එක Memory leak නොවී Clean කිරීම
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const handleFileSelect = async (incomingFile: File) => {
    if (incomingFile.type !== 'application/pdf' && !incomingFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setFile(incomingFile);
    setLoading(true);
    setResult(null);

    // Browser Object URL for fast local preview
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    const previewUrl = URL.createObjectURL(incomingFile);
    setFilePreviewUrl(previewUrl);

    try {
      const details = await getPdfDetails(incomingFile);
      setPageCount(details.pageCount);
      // Default ලෙස පළමු පිටු කිහිපය යෝජනා කිරීම
      setRangeInput(details.pageCount > 1 ? `1-${Math.min(3, details.pageCount)}` : '1');
    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('Could not read PDF. Make sure it is not password-protected.');
      setFile(null);
      setFilePreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // User type කරන Range එකට අනුව තේරෙන පිටු ගණන Live ගණනය කිරීම
  const selectedIndices = useMemo(() => {
    if (!rangeInput.trim() || pageCount === 0) return [];
    return parsePageRanges(rangeInput, pageCount);
  }, [rangeInput, pageCount]);

  const handleSplit = async () => {
    if (!file) return;

    if (selectedIndices.length === 0) {
      alert(`Please enter a valid page range between 1 and ${pageCount}. (e.g. 1-3, 5)`);
      return;
    }

    setLoading(true);

    try {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
      const res = await extractPdfPages(file, selectedIndices);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to split PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `${baseName}-extracted.pdf`;
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20"
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
            Upload a PDF to split or extract pages
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            View your document side-by-side and extract custom page ranges with 100% private in-browser processing.
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
                  {formatBytes(file.size)} • Total: <strong className="text-slate-700 dark:text-slate-200">{pageCount} pages</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {filePreviewUrl && (
                <a
                  href={filePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Fullscreen
                </a>
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setFilePreviewUrl(null);
                  setResult(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
              >
                Change PDF
              </button>
            </div>
          </div>

          {/* SIDE-BY-SIDE INTERACTIVE SPLIT WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: DOCUMENT LIVE PREVIEW (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-500" /> Live Document Preview
                </span>
                <span className="text-[11px] text-slate-400">
                  Scroll & inspect pages
                </span>
              </div>

              <div className="relative w-full h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 shadow-inner">
                {filePreviewUrl && (
                  <iframe
                    src={`${filePreviewUrl}#toolbar=0&navpanes=0`}
                    title="PDF Document Preview"
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            </div>

            {/* RIGHT: SPLIT CONTROLS & RESULT (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-white block mb-1">
                    Pages to Extract
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Check the preview on the left and enter page numbers or ranges (e.g. <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-500 font-semibold">1-3, 5</code>).
                  </p>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder={`e.g. 1-${Math.min(pageCount, 5)}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>

                {/* Live Extraction Summary Badge */}
                <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/40 border border-sky-500/20 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>Selected Pages:</span>
                    <span className="text-sky-600 dark:text-sky-400">{selectedIndices.length} of {pageCount}</span>
                  </div>
                  {selectedIndices.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Will extract: {selectedIndices.map((i) => i + 1).join(', ')}
                    </p>
                  )}
                </div>

                {/* Quick Helper Presets */}
                <div className="space-y-2">
                  <span className="text-[11px] font-medium text-slate-400 block">Quick presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setRangeInput('1')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      First Page (1)
                    </button>
                    {pageCount > 1 && (
                      <button
                        onClick={() => setRangeInput(`${pageCount}`)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Last Page ({pageCount})
                      </button>
                    )}
                    {pageCount >= 2 && (
                      <button
                        onClick={() => setRangeInput(`1-${Math.ceil(pageCount / 2)}`)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        First Half (1-{Math.ceil(pageCount / 2)})
                      </button>
                    )}
                    <button
                      onClick={() => setRangeInput(`1-${pageCount}`)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      All Pages
                    </button>
                  </div>
                </div>

                {/* Extract Button */}
                {!result && (
                  <button
                    onClick={handleSplit}
                    disabled={loading || selectedIndices.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Extracting Pages...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4" /> Extract {selectedIndices.length} Page{selectedIndices.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Success Result Card */}
              {result && (
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Extracted Successfully!
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {result.extractedPageCount} pages • {formatBytes(result.newSize)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" /> Ready
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleDownload}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Extracted PDF
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Extract Different Pages <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};