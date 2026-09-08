// src/tools/pdf/watermark/PdfWatermarkView.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Stamp, 
  Sparkles 
} from 'lucide-react';
import { renderFirstPagePreview, applyWatermark, formatBytes } from './engine';
import type { WatermarkOptions, WatermarkResult } from './engine';

const PRESET_TEXTS = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'TOP SECRET'];
const PRESET_COLORS = ['#EF4444', '#3B82F6', '#64748B', '#10B981', '#000000'];

export const PdfWatermarkView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<WatermarkResult | null>(null);

  // Watermark Settings
  const [options, setOptions] = useState<WatermarkOptions>({
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.35,
    colorHex: '#EF4444',
    position: 'diagonal',
  });

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
    setLoadingPreview(true);
    setResult(null);

    try {
      const previewData = await renderFirstPagePreview(incomingFile);
      setPreviewImg(previewData);
    } catch (err) {
      console.error(err);
      alert('Failed to read PDF. Please check if the file is password-protected.');
      setFile(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!file) return;
    if (!options.text.trim()) {
      alert('Please provide watermark text.');
      return;
    }

    setProcessing(true);
    try {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
      const res = await applyWatermark(file, options);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Watermark application failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `${baseName}-watermarked.pdf`;
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
            Upload PDF to Add Watermark
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Embed customizable security stamps, copyright notices, and confidentiality marks across all pages.
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
                  {formatBytes(file.size)} • Client-Side Processing
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPreviewImg(null);
                setResult(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {loadingPreview ? (
            <div className="p-12 text-center space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rendering live document canvas...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Visual Live Preview Canvas (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  Live Watermark Preview (Page 1)
                </span>

                <div className="relative w-full h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/90 flex items-center justify-center p-4 overflow-hidden">
                  {previewImg && (
                    <div className="relative max-h-full max-w-full shadow-2xl rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={previewImg}
                        alt="PDF Preview"
                        className="max-h-[480px] w-auto object-contain pointer-events-none select-none"
                      />

                      {/* Real-time Visual Watermark Overlay */}
                      <div
                        style={{
                          color: options.colorHex,
                          opacity: options.opacity,
                          fontSize: `${options.fontSize * 0.45}px`,
                          transform: options.position === 'diagonal' ? 'rotate(-45deg)' : 'none',
                        }}
                        className={`absolute font-black tracking-widest pointer-events-none select-none text-center uppercase whitespace-nowrap transition-all duration-150 ${
                          options.position === 'diagonal' || options.position === 'center'
                            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                            : 'bottom-6 right-6'
                        }`}
                      >
                        {options.text || 'WATERMARK'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark Controls Sidebar (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                  
                  {/* Text Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={options.text}
                      onChange={(e) => setOptions({ ...options, text: e.target.value })}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-sky-500 font-semibold"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PRESET_TEXTS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setOptions({ ...options, text: preset })}
                          className="px-2 py-1 text-[10px] font-semibold rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      Stamp Position
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['diagonal', 'center', 'bottom-right'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setOptions({ ...options, position: pos })}
                          className={`py-2 px-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                            options.position === pos
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pos.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      Color
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setOptions({ ...options, colorHex: c })}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              options.colorHex.toLowerCase() === c.toLowerCase()
                                ? 'scale-110 border-slate-900 dark:border-white ring-2 ring-sky-500/30'
                                : 'border-transparent hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={options.colorHex}
                        onChange={(e) => setOptions({ ...options, colorHex: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Sliders (Opacity & Font Size) */}
                  <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Transparency (Opacity)</span>
                        <span className="font-mono font-semibold">{Math.round(options.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={options.opacity}
                        onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                        className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Font Size</span>
                        <span className="font-mono font-semibold">{options.fontSize}pt</span>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="96"
                        step="2"
                        value={options.fontSize}
                        onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                        className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Apply & Download */}
                  <div className="space-y-3 pt-2">
                    {!result ? (
                      <button
                        onClick={handleApply}
                        disabled={processing || !options.text.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Watermarking Document...
                          </>
                        ) : (
                          <>
                            <Stamp className="w-4 h-4" /> Apply Watermark to All Pages
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Ready to Download ({formatBytes(result.size)})
                        </div>
                        <button
                          onClick={handleDownload}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4" /> Download Watermarked PDF
                        </button>
                        <button
                          onClick={() => setResult(null)}
                          className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Change Watermark Settings
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <Sparkles className="w-3 h-3 text-sky-500" />
                      <span>Permanently embedded into vector layers</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};