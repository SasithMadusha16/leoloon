// src/tools/pdf/to-image/PdfToImageView.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Archive, 
  SlidersHorizontal,
} from 'lucide-react';
import { convertPdfToImages, createZipArchive, formatBytes } from './engine';
import type { ExtractedImagePage, ImageFormat } from './engine';

export const PdfToImageView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [qualityLevel, setQualityLevel] = useState<'standard' | 'high'>('standard');
  const [loading, setLoading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [images, setImages] = useState<ExtractedImagePage[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const handleFileSelect = (incomingFile: File) => {
    if (incomingFile.type !== 'application/pdf' && !incomingFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }
    setFile(incomingFile);
    setImages([]);
  };

  const handleConvert = async () => {
    if (!file) return;

    setLoading(true);
    setProgressText('Preparing PDF pages...');

    try {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));

      const scale = qualityLevel === 'high' ? 2.0 : 1.5;
      const quality = format === 'jpeg' ? (qualityLevel === 'high' ? 0.95 : 0.85) : 1.0;

      const result = await convertPdfToImages(
        file,
        { format, scale, quality },
        (current, total) => setProgressText(`Converting page ${current} of ${total}...`)
      );

      setImages(result);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Conversion failed.');
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  const handleDownloadSingle = (image: ExtractedImagePage) => {
    if (!file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = image.previewUrl;
    link.download = `${baseName}-page-${image.pageNumber}.${image.extension}`;
    link.click();
  };

  const handleDownloadAllZip = async () => {
    if (!file || images.length === 0) return;

    setIsZipping(true);
    try {
      const zipBlob = await createZipArchive(images, file.name);
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, '')}-all-pages.zip`;
      link.click();
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
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
            Upload a PDF to convert into JPG/PNG
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Extract every page into crystal clear images with zero server uploads. 100% private in-browser execution.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">{formatBytes(file.size)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setImages([]);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {/* Options & Action Bar */}
          {images.length === 0 && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Target Format
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFormat('jpeg')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        format === 'jpeg'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      JPG (Small Size)
                    </button>
                    <button
                      onClick={() => setFormat('png')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        format === 'png'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      PNG (Lossless Quality)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Image Clarity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQualityLevel('standard')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        qualityLevel === 'standard'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Standard (150 DPI)
                    </button>
                    <button
                      onClick={() => setQualityLevel('high')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        qualityLevel === 'high'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      High-Res (300 DPI)
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {progressText || 'Extracting Images...'}
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-4 h-4" /> Convert All Pages to {format.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              {/* Batch Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Extracted {images.length} Image Page{images.length > 1 ? 's' : ''}!
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      You can download each page individually or get all in a single ZIP file.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isZipping ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                  Download All as ZIP (.zip)
                </button>
              </div>

              {/* Grid of Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.pageNumber}
                    className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                  >
                    <div className="relative bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-center aspect-[3/4] overflow-hidden border-b border-slate-100 dark:border-slate-800">
                      <img
                        src={img.previewUrl}
                        alt={`Page ${img.pageNumber}`}
                        className="max-h-full max-w-full object-contain shadow"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-sm">
                        Page {img.pageNumber}
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block uppercase">
                          .{img.extension}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatBytes(img.size)} • {img.width}x{img.height}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownloadSingle(img)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};