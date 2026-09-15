import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  UploadCloud, 
  Download, 
  Sparkles, 
  Maximize2, 
  Palette, 
  CheckCircle2, 
  ImageIcon, 
  Layers 
} from 'lucide-react';
import { 
  SOCIAL_PRESETS, 
  renderResizedImage, 
  exportCanvasBlob 
} from './engine';
import type { SocialPreset, RenderOptions } from './engine';

const PLATFORM_FILTERS = ['All', 'Instagram', 'YouTube', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn'] as const;

export const SocialResizerView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SocialPreset>(SOCIAL_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<string>('All');

  const [options, setOptions] = useState<RenderOptions>({
    fitMode: 'cover',
    backdropType: 'blur',
    backdropColor: '#0F172A',
  });

  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [downloading, setDownloading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setFile(incomingFile);
    const img = new Image();
    img.src = URL.createObjectURL(incomingFile);
    img.onload = () => {
      setImageEl(img);
    };
  };

  const redraw = useCallback(() => {
    if (canvasRef.current && imageEl) {
      renderResizedImage(canvasRef.current, imageEl, selectedPreset, options);
    }
  }, [imageEl, selectedPreset, options]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const filteredPresets = activeTab === 'All'
    ? SOCIAL_PRESETS
    : SOCIAL_PRESETS.filter((p) => p.platform === activeTab);

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return;

    setDownloading(true);
    try {
      const blob = await exportCanvasBlob(canvasRef.current, exportFormat, 0.95);
      const ext = exportFormat === 'image/jpeg' ? 'jpg' : 'png';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}-${selectedPreset.id}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloading(false);
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
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload Image to Resize for Social Media
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Auto-fit posts, banners, stories, and thumbnails for Instagram, YouTube, TikTok, X, and Facebook.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-slate-700 dark:text-slate-200">{selectedPreset.platform} {selectedPreset.name}</strong> ({selectedPreset.width} × {selectedPreset.height}px)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setImageEl(null);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different image
            </button>
          </div>

          {/* Platform Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {PLATFORM_FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedPreset.id === preset.id
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40 dark:bg-sky-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {preset.platform}
                  </span>
                  <h5 className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                    {preset.name}
                  </h5>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                  <span>{preset.aspectRatio}</span>
                  <span>{preset.width}x{preset.height}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Workspace (Preview + Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Live Canvas Preview (8 Cols) */}
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Live Dimension Viewport
              </span>

              <div className="relative w-full h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all"
                />
              </div>
            </div>

            {/* Sidebar Controls (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                {/* Fit Mode */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Fit & Framing Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOptions({ ...options, fitMode: 'cover' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        options.fitMode === 'cover'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Crop to Fill
                    </button>
                    <button
                      onClick={() => setOptions({ ...options, fitMode: 'contain' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        options.fitMode === 'contain'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Fit & Pad
                    </button>
                  </div>
                </div>

                {/* Backdrop Settings (Active only in contain mode) */}
                {options.fitMode === 'contain' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-sky-500" /> Padding Backdrop
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions({ ...options, backdropType: 'blur' })}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                          options.backdropType === 'blur'
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        Aesthetic Blur
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, backdropType: 'color' })}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                          options.backdropType === 'color'
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        Solid Color
                      </button>
                    </div>

                    {options.backdropType === 'color' && (
                      <div className="flex items-center gap-2 pt-1">
                        {['#0F172A', '#FFFFFF', '#000000', '#2563EB'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setOptions({ ...options, backdropColor: c })}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              options.backdropColor === c
                                ? 'scale-110 border-sky-500'
                                : 'border-transparent hover:scale-105'
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={options.backdropColor}
                          onChange={(e) => setOptions({ ...options, backdropColor: e.target.value })}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Export Options */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Export Format
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExportFormat('image/jpeg')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        exportFormat === 'image/jpeg'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      JPG (Optimal)
                    </button>
                    <button
                      onClick={() => setExportFormat('image/png')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        exportFormat === 'image/png'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      PNG (Crisp)
                    </button>
                  </div>

                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download for {selectedPreset.platform}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    <span>Rendered at {selectedPreset.width} × {selectedPreset.height}px</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};