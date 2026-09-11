// src/tools/video/to-gif/VideoToGifView.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Film, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Play, 
  Pause, 
  Clock, 
  FileVideo 
} from 'lucide-react';
import { 
  formatBytes, 
  formatTime, 
  convertVideoToGif 
} from './engine';
import type { 
  GifOptions, 
  GifResult, 
  GifProgress 
} from './engine';

export const VideoToGifView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Range controls
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);

  // GIF parameters
  const [fps, setFps] = useState<number>(12);
  const [targetWidth, setTargetWidth] = useState<number>(480);
  const [colors, setColors] = useState<number>(128);

  // Conversion state
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<GifProgress | null>(null);
  const [result, setResult] = useState<GifResult | null>(null);

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
    setProgress(null);
    setStartTime(0);
    setVideoUrl(URL.createObjectURL(incomingFile));
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      // Default to 4 seconds or full length if shorter
      setEndTime(Math.min(4, dur));
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

  const handleConvert = async () => {
    if (!file) return;

    if (endTime <= startTime) {
      alert('End time must be greater than Start time.');
      return;
    }

    if (endTime - startTime > 20) {
      if (!confirm('Generating a GIF longer than 20 seconds may create a very large file. Do you want to continue?')) {
        return;
      }
    }

    setIsConverting(true);
    setProgress({ stage: 'Extracting frames...', percent: 0, currentFrame: 0, totalFrames: 0 });

    try {
      if (result?.url) URL.revokeObjectURL(result.url);

      const options: GifOptions = {
        startTime,
        endTime,
        fps,
        targetWidth,
        colors,
      };

      const gifData = await convertVideoToGif(file, options, (p: GifProgress) => {
        setProgress(p);
      });

      setResult(gifData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'GIF conversion failed.');
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${baseName}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clipDuration = Math.max(0, endTime - startTime);

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
            Upload Video to Create Animated GIF
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Convert MP4, WebM, and MOV videos into high-quality, looping GIFs client-side with custom FPS.
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
                  {formatBytes(file.size)} • Duration: {formatTime(duration)}
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
            
            {/* Visual Source Player (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative w-full h-[400px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden shadow-xl">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={() => {
                      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
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

              {/* Scrubber */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-500 hover:bg-sky-100 transition-colors shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.05"
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer block"
                  />
                </div>
                <span className="font-mono text-xs text-slate-500 font-bold shrink-0">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* GIF Controls & Export (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Clip Trimming Range
                </span>

                {/* Start & End Points */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Start: {formatTime(startTime)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={endTime}
                      step="0.1"
                      value={startTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStartTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => setStartTime(currentTime)}
                      className="w-full mt-1.5 py-1 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      Set to current
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      End: {formatTime(endTime)}
                    </label>
                    <input
                      type="range"
                      min={startTime}
                      max={duration || 100}
                      step="0.1"
                      value={endTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEndTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => setEndTime(currentTime)}
                      className="w-full mt-1.5 py-1 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      Set to current
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" /> Output GIF Duration:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {formatTime(clipDuration)}
                  </span>
                </div>

                {/* Resolution & FPS */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-500" /> Target Resolution
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { w: 320, label: '320px', sub: 'Compact' },
                        { w: 480, label: '480px', sub: 'Balanced' },
                        { w: 640, label: '640px', sub: 'HD' },
                      ].map((item) => (
                        <button
                          key={item.w}
                          onClick={() => setTargetWidth(item.w)}
                          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                            targetWidth === item.w
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-xs block">{item.label}</span>
                          <span className="text-[9px] text-slate-400 font-normal">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Frame Rate (FPS)
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[10, 12, 16].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setFps(rate)}
                            className={`py-1 text-xs font-semibold rounded border transition-all ${
                              fps === rate
                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            {rate}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Color Palette
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {[128, 256].map((c) => (
                          <button
                            key={c}
                            onClick={() => setColors(c)}
                            className={`py-1 text-xs font-semibold rounded border transition-all ${
                              colors === c
                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            {c} Colors
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Trigger & Results */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {!result ? (
                    <button
                      onClick={handleConvert}
                      disabled={isConverting || clipDuration <= 0}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {isConverting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> {progress?.stage || 'Generating GIF...'}
                        </>
                      ) : (
                        <>
                          <Film className="w-4 h-4" /> Convert to Animated GIF
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {/* Result Preview Box */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> GIF Created Successfully
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            {formatBytes(result.size)}
                          </span>
                        </div>

                        {/* Live looping preview */}
                        <div className="w-full h-44 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800">
                          <img
                            src={result.url}
                            alt="Animated GIF Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{result.width} × {result.height}px • {result.framesCount} frames</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Infinite Loop</span>
                        </div>
                      </div>

                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Animated GIF
                      </button>

                      <button
                        onClick={() => setResult(null)}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Adjust settings & create another GIF
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Pure in-browser canvas quantization • Zero cloud upload</span>
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

export default VideoToGifView;