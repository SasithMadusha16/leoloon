import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  UploadCloud, 
  Copy, 
  Check, 
  Download, 
  Palette, 
  Code2, 
  Sparkles, 
  Sliders 
} from 'lucide-react';
import { 
  extractPaletteFromImage, 
  generatePaletteCardBlob 
} from './engine';
import type { ColorSwatch } from './engine';

export const PaletteExtractorView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [colorCount, setColorCount] = useState<number>(6);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [exportTab, setExportTab] = useState<'css' | 'tailwind' | 'json'>('css');
  const [downloadingCard, setDownloadingCard] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (incomingFile: File) => {
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

  const computePalette = useCallback(() => {
    if (imageEl) {
      const palette = extractPaletteFromImage(imageEl, colorCount);
      setSwatches(palette);
    }
  }, [imageEl, colorCount]);

  useEffect(() => {
    computePalette();
  }, [computePalette]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const getCssVariables = () => {
    return `:root {\n${swatches
      .map((s, idx) => `  --color-${idx + 1}: ${s.hex}; /* ${s.percentage}% */`)
      .join('\n')}\n}`;
  };

  const getTailwindConfig = () => {
    const entries = swatches
      .map((s, idx) => `      'palette-${idx + 1}': '${s.hex}',`)
      .join('\n');
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      }\n    }\n  }\n};`;
  };

  const getJsonExport = () => {
    return JSON.stringify(
      swatches.map((s, idx) => ({
        index: idx + 1,
        hex: s.hex,
        rgb: s.rgb,
        hsl: s.hsl,
        dominance: `${s.percentage}%`,
      })),
      null,
      2
    );
  };

  const handleDownloadCard = async () => {
    if (!file || swatches.length === 0) return;
    setDownloadingCard(true);
    try {
      const blob = await generatePaletteCardBlob(swatches, file.name);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.[^/.]+$/, '')}-palette-card.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingCard(false);
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
            Upload Image to Extract Color Palette
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Extract dominant colors, calculate visual contrast, and export code for CSS, Tailwind, or JSON.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {swatches.length} Dominant Colors • K-Means Clustered
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadCard}
                disabled={downloadingCard}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Download Swatch Card (PNG)
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setImageEl(null);
                  setSwatches([]);
                }}
                className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
              >
                Change Image
              </button>
            </div>
          </div>

          {/* Connected Spectrum Strip */}
          <div className="h-16 w-full rounded-2xl overflow-hidden shadow-lg flex border border-slate-200 dark:border-slate-800">
            {swatches.map((swatch, idx) => (
              <div
                key={idx}
                onClick={() => copyToClipboard(swatch.hex)}
                style={{
                  backgroundColor: swatch.hex,
                  width: `${Math.max(swatch.percentage, 10)}%`,
                }}
                title={`Click to copy ${swatch.hex}`}
                className="h-full flex items-end justify-center pb-2 cursor-pointer transition-transform hover:scale-105 group relative select-none"
              >
                <span
                  style={{ color: swatch.textColor }}
                  className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded"
                >
                  {swatch.hex}
                </span>
              </div>
            ))}
          </div>

          {/* Main Content Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Source Image & Count Selector (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Original Source
                </span>
                <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800">
                  <img
                    src={imageEl?.src}
                    alt="Source"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-500" /> Palette Swatch Count:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[5, 6, 8, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => setColorCount(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                          colorCount === num
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Swatches Detail Cards & Export Tabs (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Swatch Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {swatches.map((swatch, idx) => (
                  <div
                    key={idx}
                    onClick={() => copyToClipboard(swatch.hex)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-sky-500/50 cursor-pointer transition-all group"
                  >
                    <div
                      style={{ backgroundColor: swatch.hex }}
                      className="w-full h-14 rounded-lg shadow-inner flex items-center justify-center relative mb-2.5"
                    >
                      <span
                        style={{ color: swatch.textColor }}
                        className="text-[11px] font-bold font-mono tracking-wider"
                      >
                        {swatch.hex}
                      </span>
                      {copiedCode === swatch.hex && (
                        <div className="absolute inset-0 bg-slate-950/80 rounded-lg flex items-center justify-center text-white text-xs font-bold gap-1 animate-fadeIn">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500 font-mono">
                        <span>RGB:</span>
                        <span>{swatch.rgb.r}, {swatch.rgb.g}, {swatch.rgb.b}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Dominance:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{swatch.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Developer Export Panel */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-sky-500" /> Code Export Formats
                  </span>

                  <div className="flex items-center gap-1">
                    {(['css', 'tailwind', 'json'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setExportTab(tab)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                          exportTab === tab
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-500/40'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800 select-all leading-relaxed">
                    {exportTab === 'css' && getCssVariables()}
                    {exportTab === 'tailwind' && getTailwindConfig()}
                    {exportTab === 'json' && getJsonExport()}
                  </pre>

                  <button
                    onClick={() => {
                      const code =
                        exportTab === 'css'
                          ? getCssVariables()
                          : exportTab === 'tailwind'
                          ? getTailwindConfig()
                          : getJsonExport();
                      copyToClipboard(code);
                    }}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  <span>K-Means Euclidean distance quantization computed in-memory</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};