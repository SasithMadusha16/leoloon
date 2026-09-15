import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  FileVideo, 
  Sliders, 
  ArrowDownRight, 
  Play
} from 'lucide-react';
import { 
  formatBytes, 
  formatTime, 
  compressVideoClientSide 
} from './engine';
import type { 
  CompressionLevel, 
  TargetResolution, 
  CompressResult, 
  CompressProgress 
} from './engine';

export const VideoCompressorView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Settings
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [resolution, setResolution] = useState<TargetResolution>('720p');

  // Processing state
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<CompressResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [videoUrl, result]);

  const handleFileSelect = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFile(incomingFile);
    setResult(null);
    setProgress(0);
    setVideoUrl(URL.createObjectURL(incomingFile));
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setOriginalDimensions({
        w: videoRef.current.videoWidth,
        h: videoRef.current.videoHeight,
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setProgress(0);

    try {
      if (result?.url) URL.revokeObjectURL(result.url);

      const compressData = await compressVideoClientSide(
        file,
        resolution,
        level,
        (p: CompressProgress) => {
          setProgress(p.percent);
        }
      );

      setResult(compressData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Compression failed.');
    } finally {
      setIsCompressing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${baseName}-compressed.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            accept="video/*"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload Video to Compress & Downscale
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Shrink MP4, WebM, and MOV video file sizes locally in your browser with zero quality drop.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  Original: {formatBytes(file.size)} • {originalDimensions ? `${originalDimensions.w}×${originalDimensions.h}` : ''} • {formatTime(duration)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setResult(null);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Preview (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative w-full h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden shadow-xl">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900/70 hover:bg-sky-600 text-white backdrop-blur-sm flex items-center justify-center transition-all opacity-0 hover:opacity-100 shadow-lg"
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </button>
                )}
              </div>
            </div>

            {/* Compression Settings & Actions (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                {/* Compression Level */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-500" /> Compression Strategy
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', title: 'Light', desc: '~30% off' },
                      { id: 'balanced', title: 'Balanced', desc: '~50% off' },
                      { id: 'aggressive', title: 'Aggressive', desc: '~70% off' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setLevel(m.id as CompressionLevel)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          level === m.id
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-xs block">{m.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Resolution */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Target Resolution
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['original', '1080p', '720p', '480p'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all uppercase ${
                          resolution === res
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compression Trigger & Results */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {!result ? (
                    <button
                      onClick={handleCompress}
                      disabled={isCompressing}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {isCompressing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Compressing ({progress}%)
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-4 h-4" /> Compress Video
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Comparison Metric */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Compression Complete!
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold font-mono">
                            -{result.savingsPercent}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 line-through">{formatBytes(result.originalSize)}</span>
                          <span className="font-bold text-slate-800 dark:text-white font-mono text-sm">
                            {formatBytes(result.compressedSize)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Compressed Video
                      </button>

                      <button
                        onClick={() => setResult(null)}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Adjust settings & re-compress
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>In-memory encoding • Zero server footprint</span>
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

export default VideoCompressorView;