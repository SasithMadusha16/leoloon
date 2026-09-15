import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  UploadCloud, 
  Download, 
  Grid3X3, 
  Droplet, 
  Square, 
  Undo2, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders 
} from 'lucide-react';
import { 
  renderCensoredCanvas, 
  exportCanvasBlob, 
  formatBytes 
} from './engine';
import type { CensorMode, CensorBox } from './engine';

export const ImageCensorView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [boxes, setBoxes] = useState<CensorBox[]>([]);
  const [activeMode, setActiveMode] = useState<CensorMode>('pixelate');
  const [intensity, setIntensity] = useState<number>(20);
  const [blackoutColor, setBlackoutColor] = useState<string>('#000000');
  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [exporting, setExporting] = useState<boolean>(false);

  // Drag interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draftBox, setDraftBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setFile(incomingFile);
    setBoxes([]);
    setDraftBox(null);

    const img = new Image();
    img.src = URL.createObjectURL(incomingFile);
    img.onload = () => {
      setImageEl(img);
    };
  };

  const redraw = useCallback(() => {
    if (canvasRef.current && imageEl) {
      renderCensoredCanvas(canvasRef.current, imageEl, boxes, draftBox);
    }
  }, [imageEl, boxes, draftBox]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Coordinate mapping from screen mouse coordinates to actual image pixels
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((clientX - rect.left) * scaleX);
    const y = Math.round((clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(x, canvas.width)),
      y: Math.max(0, Math.min(y, canvas.height)),
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDragging(true);
    setDragStart(coords);
    setDraftBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;

    const currentCoords = getCanvasCoords(e);
    const x = Math.min(dragStart.x, currentCoords.x);
    const y = Math.min(dragStart.y, currentCoords.y);
    const width = Math.abs(currentCoords.x - dragStart.x);
    const height = Math.abs(currentCoords.y - dragStart.y);

    setDraftBox({ x, y, width, height });
  };

  const handlePointerUp = () => {
    if (!isDragging || !draftBox) return;
    setIsDragging(false);
    setDragStart(null);

    // Only commit box if it has reasonable size (at least 6px)
    if (draftBox.width > 6 && draftBox.height > 6) {
      const newBox: CensorBox = {
        id: Math.random().toString(36).substring(2, 9),
        x: draftBox.x,
        y: draftBox.y,
        width: draftBox.width,
        height: draftBox.height,
        mode: activeMode,
        intensity,
        color: blackoutColor,
      };
      setBoxes((prev) => [...prev, newBox]);
    }
    setDraftBox(null);
  };

  const handleUndo = () => {
    setBoxes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setBoxes([]);
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return;

    setExporting(true);
    try {
      const blob = await exportCanvasBlob(canvasRef.current, exportFormat, 0.95);
      const ext = exportFormat === 'image/jpeg' ? 'jpg' : 'png';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}-censored.${ext}`;
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
            Upload Image to Censor & Redact
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Drag to pixelate, blur, or blackout faces, credentials, or private details with zero cloud uploads.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} • <strong className="text-slate-700 dark:text-slate-200">{boxes.length} redacted areas</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setImageEl(null);
                setBoxes([]);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different image
            </button>
          </div>

          {/* Interactive Workspace (8 Cols Canvas + 4 Cols Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Main Interactive Canvas (8 Cols) */}
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Interactive Censor Canvas
                </span>
                <span className="text-[11px] text-sky-500 font-medium">
                  💡 Click & drag a box over sensitive areas
                </span>
              </div>

              <div className="relative w-full h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl cursor-crosshair touch-none"
                />
              </div>
            </div>

            {/* Sidebar Controls (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                {/* Mode Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Censorship Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setActiveMode('pixelate')}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        activeMode === 'pixelate'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" /> Pixelate
                    </button>

                    <button
                      onClick={() => setActiveMode('blur')}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        activeMode === 'blur'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Droplet className="w-4 h-4" /> Blur
                    </button>

                    <button
                      onClick={() => setActiveMode('blackout')}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        activeMode === 'blackout'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Square className="w-4 h-4" /> Blackout
                    </button>
                  </div>
                </div>

                {/* Intensity / Settings */}
                {activeMode !== 'blackout' ? (
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-sky-500" />
                        {activeMode === 'pixelate' ? 'Pixel Block Size' : 'Blur Radius'}
                      </span>
                      <span className="font-mono text-sky-600 dark:text-sky-400">{intensity}px</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="60"
                      step="2"
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Bar Color
                    </label>
                    <div className="flex items-center gap-2">
                      {['#000000', '#FFFFFF', '#EF4444', '#1E293B'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setBlackoutColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            blackoutColor === c
                              ? 'scale-110 border-sky-500'
                              : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* History Actions (Undo / Clear) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleUndo}
                    disabled={boxes.length === 0}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Undo Box
                  </button>

                  <button
                    onClick={handleClear}
                    disabled={boxes.length === 0}
                    className="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-950/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All ({boxes.length})
                  </button>
                </div>

                {/* Export Options & Download */}
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
                    disabled={exporting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download Censored Image
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    <span>Permanent pixel destruction • Irreversible</span>
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