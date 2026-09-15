import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Download, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { 
  runAiBackgroundRemoval, 
  applyBackdropColor, 
  formatBytes 
} from './engine';
import type { ProgressState } from './engine';

const BACKDROP_PRESETS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Dark Slate', value: '#0F172A' },
  { name: 'Studio Blue', value: '#2563EB' },
  { name: 'Vibrant Red', value: '#DC2626' },
];

export const BgRemoverView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [rawCutoutBlob, setRawCutoutBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeBackdrop, setActiveBackdrop] = useState<string>('transparent');

  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressState>({ stage: '', percent: 0 });
  const [exporting, setExporting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [originalUrl, previewUrl]);

  const handleFileSelect = async (incomingFile: File) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(incomingFile);
    setOriginalUrl(URL.createObjectURL(incomingFile));
    setRawCutoutBlob(null);
    setPreviewUrl(null);
    setActiveBackdrop('transparent');
    setLoading(true);

    try {
      const cutout = await runAiBackgroundRemoval(incomingFile, (p) => {
        setProgress(p);
      });

      setRawCutoutBlob(cutout);
      setPreviewUrl(URL.createObjectURL(cutout));
    } catch (err) {
      console.error(err);
      alert('AI Background removal failed. Please check your internet connection for the initial AI model load.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropChange = async (color: string) => {
    if (!rawCutoutBlob) return;
    setActiveBackdrop(color);

    if (color === 'transparent') {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(rawCutoutBlob));
      return;
    }

    try {
      const tintedBlob = await applyBackdropColor(rawCutoutBlob, color);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(tintedBlob));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async () => {
    if (!rawCutoutBlob || !file) return;

    setExporting(true);
    try {
      const finalBlob = activeBackdrop === 'transparent'
        ? rawCutoutBlob
        : await applyBackdropColor(rawCutoutBlob, activeBackdrop);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const url = URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}-removed-bg.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50"
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
            Upload Image to Remove Background
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Neural segmentation runs 100% in-browser. Fast cutouts with no cloud uploads or limits.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} • Client-Side Neural Cutout
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setRawCutoutBlob(null);
                setPreviewUrl(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Upload another photo
            </button>
          </div>

          {/* AI Processing Card */}
          {loading && (
            <div className="p-12 text-center space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {progress.stage || 'Initializing AI Neural Model...'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Initial load downloads the WebAssembly model once into your browser cache.
                </p>
              </div>

              {progress.percent > 0 && (
                <div className="max-w-xs mx-auto space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-200"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{progress.percent}%</span>
                </div>
              )}
            </div>
          )}

          {/* AI Cutout Workspace */}
          {!loading && previewUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Visual Canvas (8 cols) */}
              <div className="lg:col-span-8 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-500" /> AI Cutout Result
                  </span>
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Segmentation Completed
                  </span>
                </div>

                {/* Checkerboard Backdrop Frame */}
                <div
                  style={{
                    backgroundImage: activeBackdrop === 'transparent' ? `
                      linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                      linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                      linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                    ` : 'none',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: activeBackdrop === 'transparent' ? '#0f172a' : activeBackdrop,
                  }}
                  className="relative w-full h-[500px] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 overflow-hidden transition-colors duration-200"
                >
                  <img
                    src={previewUrl}
                    alt="Cutout Preview"
                    className="max-h-full max-w-full object-contain rounded shadow-2xl transition-all select-none"
                  />
                </div>
              </div>

              {/* Sidebar Controls (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                  
                  {/* Backdrop Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2.5">
                      Change Background
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BACKDROP_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => handleBackdropChange(preset.value)}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all ${
                            activeBackdrop === preset.value
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span
                            style={{
                              backgroundColor: preset.value === 'transparent' ? '#0f172a' : preset.value,
                            }}
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                          />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download Action */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleDownload}
                      disabled={exporting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {exporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Preparing Download...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Download High-Res PNG
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <Sparkles className="w-3 h-3 text-sky-500" />
                      <span>Zero compression loss • Full resolution</span>
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