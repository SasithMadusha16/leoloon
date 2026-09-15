import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  MapPin, 
  Camera, 
  Calendar, 
  Sparkles, 
  FileCheck2, 
  Smartphone 
} from 'lucide-react';
import { 
  extractExifMetadata, 
  stripMetadataAndExport, 
  formatBytes 
} from './engine';
import type { DetectedMetadata, CleanResult } from './engine';

export const ExifStripperView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DetectedMetadata | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [cleaning, setCleaning] = useState<boolean>(false);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    };
  }, [previewUrl, result]);

  const handleFileSelect = async (incomingFile: File) => {
    if (!incomingFile.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);

    setFile(incomingFile);
    setPreviewUrl(URL.createObjectURL(incomingFile));
    setResult(null);
    setAnalyzing(true);

    try {
      const meta = await extractExifMetadata(incomingFile);
      setMetadata(meta);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStrip = async () => {
    if (!file) return;

    setCleaning(true);
    try {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
      const cleanData = await stripMetadataAndExport(file, exportFormat, 0.95);
      setResult(cleanData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to strip metadata.');
    } finally {
      setCleaning(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const ext = exportFormat === 'image/jpeg' ? 'jpg' : exportFormat === 'image/png' ? 'png' : 'webp';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `${baseName}-sanitized.${ext}`;
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
            accept="image/*"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload Image to Strip EXIF & Metadata
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Scan and wipe hidden GPS coordinates, camera models, and private timestamps before sharing online.
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
                  {formatBytes(file.size)} • Client-Side Privacy Sanitizer
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setMetadata(null);
                setResult(null);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different image
            </button>
          </div>

          {/* Main Inspection Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Preview (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Source Preview
              </span>

              <div className="relative w-full h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Inspection preview"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                  />
                )}
              </div>
            </div>

            {/* Privacy Inspection Card (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Embedded Metadata Audit
                  </span>
                  {analyzing ? (
                    <span className="text-xs text-sky-500 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Scanning headers...
                    </span>
                  ) : metadata?.hasExif ? (
                    <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Sensitive Metadata Detected
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> No Header EXIF Found
                    </span>
                  )}
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* GPS Tag */}
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    metadata?.hasGps
                      ? 'border-rose-300 bg-rose-50/50 dark:border-rose-950/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400'
                  }`}>
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">GPS Coordinates</span>
                      <span className="text-[11px] opacity-80">
                        {metadata?.hasGps ? 'Latitude & Longitude present' : 'None detected'}
                      </span>
                    </div>
                  </div>

                  {/* Camera Model */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                    <Camera className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                    <div className="truncate">
                      <span className="font-bold block">Camera / Device</span>
                      <span className="text-[11px] opacity-80 truncate block">
                        {metadata?.cameraMake || metadata?.cameraModel
                          ? `${metadata.cameraMake || ''} ${metadata.cameraModel || ''}`.trim()
                          : 'Not embedded'}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                    <div className="truncate">
                      <span className="font-bold block">Timestamp Date</span>
                      <span className="text-[11px] opacity-80 truncate block">
                        {metadata?.dateTime || 'No original date tag'}
                      </span>
                    </div>
                  </div>

                  {/* Software */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                    <div className="truncate">
                      <span className="font-bold block">App / Software</span>
                      <span className="text-[11px] opacity-80 truncate block">
                        {metadata?.software || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sanitizer Format & Action */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Export Safe Format
                    </label>
                    <div className="flex items-center gap-1.5">
                      {(['image/jpeg', 'image/png', 'image/webp'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                            exportFormat === fmt
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-500/40'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          {fmt.replace('image/', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!result ? (
                    <button
                      onClick={handleStrip}
                      disabled={cleaning}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {cleaning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Wiping Metadata Segments...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Strip All EXIF & Wipe Tracking Data
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <FileCheck2 className="w-4 h-4" /> Photo Sanitized Successfully ({formatBytes(result.size)})
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        All GPS coordinates, timestamps, and device fingerprints have been permanently removed.
                      </p>
                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Safe Photo
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    <span>Pure raw canvas reconstruction • Zero residual metadata</span>
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