import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  LayoutTemplate 
} from 'lucide-react';
import { convertImagesToPdf, formatBytes } from './engine';
import type { ImageItem, PageOrientation, ImageToPdfResult } from './engine';

export const ImageToPdfView = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ImageToPdfResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean memory object URLs when unmounting
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    };
  }, []);

  const handleAddImages = (incomingFiles: FileList | File[]) => {
    const validFiles = Array.from(incomingFiles).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const newItems: ImageItem[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setImages((prev) => [...prev, ...newItems]);
    setResult(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    setResult(null);
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;

    setLoading(true);
    setProgress(0);

    try {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
      const res = await convertImagesToPdf(images, orientation, (p) => setProgress(p));
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `images-compiled-${Date.now()}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleAddImages(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleAddImages(e.target.files)}
          accept="image/*"
          multiple
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-3 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
          Drop photos here or click to browse
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Add single or multiple PNG, JPG, or WebP images to compile into one document.
        </p>
      </div>

      {images.length > 0 && (
        <div className="space-y-6">
          {/* Controls: Layout & Add More */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Page Orientation
              </label>
              <div className="flex items-center gap-2">
                {(
                  [
                    { id: 'portrait', label: 'A4 Portrait' },
                    { id: 'landscape', label: 'A4 Landscape' },
                    { id: 'fit', label: 'Fit to Image' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setOrientation(opt.id);
                      setResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      orientation === opt.id
                        ? 'bg-sky-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add More Photos
            </button>
          </div>

          {/* Reorderable Image Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Page Sequence ({images.length} Image{images.length > 1 ? 's' : ''})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60"
                >
                  <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatBytes(item.size)}</p>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === images.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeImage(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          {!result && (
            <button
              onClick={handleGeneratePdf}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Compiling PDF ({progress}%)...
                </>
              ) : (
                <>
                  <LayoutTemplate className="w-4 h-4" /> Convert {images.length} Images to PDF
                </>
              )}
            </button>
          )}

          {/* Result Output */}
          {result && (
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    PDF Created Successfully!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Compiled {result.pageCount} pages into one clean document ({formatBytes(result.totalSize)}).
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Download PDF Document
                </button>
                <button
                  onClick={() => {
                    setImages([]);
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
      )}
    </div>
  );
};