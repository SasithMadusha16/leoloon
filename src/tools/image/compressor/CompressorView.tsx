// src/tools/image/compressor/CompressorView.tsx
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, RefreshCw, FileImage, CheckCircle, Sparkles } from 'lucide-react';
import { compressImage, formatBytes, type CompressionResult } from './engine';

export const CompressorView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [format, setFormat] = useState<string>('image/webp');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
      return;
    }
    setFile(incomingFile);
    processCompression(incomingFile, quality, format);
  };

  const processCompression = async (imgFile: File, q: number, fmt: string) => {
    setLoading(true);
    try {
      if (result?.previewUrl) {
        URL.revokeObjectURL(result.previewUrl);
      }
      const res = await compressImage(imgFile, q / 100, fmt);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-run compression when slider or format changes
  useEffect(() => {
    if (file) {
      const timer = setTimeout(() => {
        processCompression(file, quality, format);
      }, 200); // 200ms debounce
      return () => clearTimeout(timer);
    }
  }, [quality, format]);

  const handleDownload = () => {
    if (!result || !file) return;
    const extension = format.split('/')[1] || 'webp';
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = `compressed-${file.name.replace(/\.[^/.]+$/, '')}.${extension}`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Choose an image or drop it here
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Supports PNG, JPG, and WebP. Fully compressed in browser without uploading anywhere.
          </p>
        </div>
      ) : (
        /* Compression Controls & Preview Grid */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {/* Quality Slider */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label htmlFor="quality-slider" className="text-slate-700 dark:text-slate-300">Compression Quality</label>
                <span className="text-sky-600 dark:text-sky-400">{quality}%</span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="10"
                max="95"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Smaller Size</span>
                <span>Best Quality</span>
              </div>
            </div>

            {/* Target Format */}
            <div className="space-y-1.5">
              <label htmlFor="format-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Output Format
              </label>
              <select
                id="format-select"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="image/webp">WebP (Recommended - Smallest)</option>
                <option value="image/jpeg">JPEG (Standard)</option>
                <option value="image/png">PNG (Lossless)</option>
              </select>
            </div>
          </div>

          {/* Stats Bar */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Original Size</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5 block">
                  {formatBytes(result.originalSize)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Compressed Size</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {formatBytes(result.compressedSize)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Reduction</span>
                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> -{result.compressionRatio}%
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Dimensions</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5 block">
                  {result.width} × {result.height}px
                </span>
              </div>
            </div>
          )}

          {/* Image Preview & Actions */}
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[260px]">
            {loading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" /> Compressing image...
              </div>
            ) : result ? (
              <img
                src={result.previewUrl}
                alt="Compressed preview"
                className="max-h-[380px] max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : null}
          </div>

          {/* Action Buttons */}
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
              <Download className="w-4 h-4" /> Download Compressed Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};