import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  UploadCloud, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Download, 
  RotateCcw, 
  Sliders, 
  Sparkles 
} from 'lucide-react';
import { defaultSettings, applyTransformsAndFilters, exportCanvasToBlob } from './engine';
import type { EditorSettings } from './engine';

export const PhotoEditorView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setFile(incomingFile);
    setSettings(defaultSettings);

    const img = new Image();
    img.src = URL.createObjectURL(incomingFile);
    img.onload = () => {
      setImageEl(img);
    };
  };

  const updateCanvas = useCallback(() => {
    if (canvasRef.current && imageEl) {
      applyTransformsAndFilters(canvasRef.current, imageEl, settings);
    }
  }, [imageEl, settings]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const handleRotate = () => {
    setSettings((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleFlipH = () => {
    setSettings((prev) => ({ ...prev, flipH: !prev.flipH }));
  };

  const handleFlipV = () => {
    setSettings((prev) => ({ ...prev, flipV: !prev.flipV }));
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return;

    const blob = await exportCanvasToBlob(canvasRef.current, exportFormat, 0.95);
    const ext = exportFormat === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}-edited.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
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
            Upload a photo to edit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adjust lighting, colors, orientation, and apply filters with instant live preview.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Canvas Workspace (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Studio Canvas
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setImageEl(null);
                }}
                className="text-xs font-semibold text-rose-500 hover:underline"
              >
                Change Image
              </button>
            </div>

            <div className="relative w-full h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>

          {/* Controls Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
              
              {/* Transforms */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Transform & Orientation
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotate}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> 90°
                  </button>
                  <button
                    onClick={handleFlipH}
                    className={`flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors ${
                      settings.flipH ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
                  </button>
                  <button
                    onClick={handleFlipV}
                    className={`flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors ${
                      settings.flipV ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" /> Flip V
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-500" /> Color Adjustments
                  </label>
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Brightness</span>
                      <span>{settings.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={settings.brightness}
                      onChange={(e) => setSettings({ ...settings, brightness: Number(e.target.value) })}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Contrast</span>
                      <span>{settings.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={settings.contrast}
                      onChange={(e) => setSettings({ ...settings, contrast: Number(e.target.value) })}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Saturation</span>
                      <span>{settings.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={settings.saturation}
                      onChange={(e) => setSettings({ ...settings, saturation: Number(e.target.value) })}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Sepia (Warmth)</span>
                      <span>{settings.sepia}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sepia}
                      onChange={(e) => setSettings({ ...settings, sepia: Number(e.target.value) })}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Grayscale (B&W)</span>
                      <span>{settings.grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.grayscale}
                      onChange={(e) => setSettings({ ...settings, grayscale: Number(e.target.value) })}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Export Bar */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExportFormat('image/jpeg')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      exportFormat === 'image/jpeg'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => setExportFormat('image/png')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      exportFormat === 'image/png'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    PNG
                  </button>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Edited Photo
                </button>

                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  <span>High-resolution browser export</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};