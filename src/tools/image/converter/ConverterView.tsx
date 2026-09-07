// src/tools/image/converter/ConverterView.tsx
import { useState, useRef } from 'react';
import { UploadCloud, Download, RefreshCw, ArrowRight, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { convertImageFormat, formatBytes } from './engine';
import type { SupportedFormat, ConversionResult } from './engine';

export const ConverterView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('image/webp');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (incomingFile: File, formatToUse = targetFormat) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    setFile(incomingFile);
    setLoading(true);

    try {
      if (result?.previewUrl) {
        URL.revokeObjectURL(result.previewUrl);
      }
      const res = await convertImageFormat(incomingFile, formatToUse);
      setResult(res);
    } catch (err) {
      console.error('Conversion failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatChange = (newFormat: SupportedFormat) => {
    setTargetFormat(newFormat);
    if (file) {
      handleFileSelect(file, newFormat);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = `${baseName}.${result.extension}`;
    link.click();
  };

  const formatLabels: Record<SupportedFormat, { title: string; desc: string }> = {
    'image/webp': { title: 'WebP', desc: 'Next-gen web format, smallest file size' },
    'image/png': { title: 'PNG', desc: 'Lossless quality, preserves transparency' },
    'image/jpeg': { title: 'JPG / JPEG', desc: 'Universal standard for photos & print' },
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
            accept="image/*"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload an image to convert
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Convert seamlessly between JPG, PNG, and WebP format without uploading to any remote server.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-3">
              Choose Target Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(formatLabels) as SupportedFormat[]).map((fmt) => {
                const isSelected = targetFormat === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => handleFormatChange(fmt)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-slate-900 dark:text-white shadow-sm ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{formatLabels[fmt].title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                      {formatLabels[fmt].desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {result && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sky-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[220px]">
                    {file.name}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Original: {formatBytes(result.originalSize)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {result.extension}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Converted: {formatBytes(result.newSize)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[260px]">
            {loading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" /> Converting format...
              </div>
            ) : result ? (
              <img
                src={result.previewUrl}
                alt="Converted preview"
                className="max-h-[380px] max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Choose different image
            </button>

            <button
              onClick={handleDownload}
              disabled={loading || !result}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download as .{result?.extension.toUpperCase()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};