// src/tools/video/trimmer/VideoTrimmerView.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Scissors, 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  Clock, 
  Video, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw 
} from 'lucide-react';
import { 
  formatTime, 
  formatBytes, 
  trimVideoClientSide 
} from './engine';
import type { TrimProgress } from './engine';

export const VideoTrimmerView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Range endpoints
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // Processing & Export
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [trimmedResult, setTrimmedResult] = useState<{ url: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedResult?.url) URL.revokeObjectURL(trimmedResult.url);
    };
  }, [videoUrl, trimmedResult]);

  const handleFileSelect = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (trimmedResult?.url) URL.revokeObjectURL(trimmedResult.url);

    setFile(incomingFile);
    setTrimmedResult(null);
    setStartTime(0);
    setEndTime(0);
    setVideoUrl(URL.createObjectURL(incomingFile));
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const playPreviewRange = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play();

    const checkPreviewLimit = () => {
      if (!videoRef.current) return;
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        videoRef.current.currentTime = startTime;
      } else if (!videoRef.current.paused) {
        requestAnimationFrame(checkPreviewLimit);
      }
    };
    requestAnimationFrame(checkPreviewLimit);
  };

  const handleTrimAndExport = async () => {
    if (!videoUrl || !file) return;

    if (endTime <= startTime) {
      alert('End time must be greater than Start time.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      if (trimmedResult?.url) URL.revokeObjectURL(trimmedResult.url);

      const result = await trimVideoClientSide(
        videoUrl,
        startTime,
        endTime,
        (p: TrimProgress) => {
          setExportProgress(p.percent);
        }
      );

      setTrimmedResult({ url: result.url, size: result.size });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Trimming failed.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleDownload = () => {
    if (!trimmedResult || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = trimmedResult.url;
    a.download = `${baseName}-trimmed.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cutDuration = Math.max(0, endTime - startTime);

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
            Upload Video to Trim & Cut
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Trim MP4, WebM, and MOV clips client-side with millisecond precision and zero cloud uploads.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
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
                setTrimmedResult(null);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Main Video Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Preview Player (8 Cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div className="relative w-full h-[440px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden shadow-2xl">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {/* Overlay Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900/70 hover:bg-sky-600 text-white backdrop-blur-sm flex items-center justify-center transition-all opacity-0 hover:opacity-100 focus:opacity-100 shadow-lg"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
              </div>

              {/* Scrubber & Current Time Bar */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-500 hover:bg-sky-100 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {formatTime(currentTime)} <span className="text-slate-400 font-normal">/ {formatTime(duration)}</span>
                    </span>
                  </div>

                  <button
                    onClick={playPreviewRange}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Preview Selection Only
                  </button>
                </div>

                {/* Progress Seeking Range Slider */}
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
                  className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Sidebar Controls (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Trim Duration & Markers
                </span>

                {/* Start Time Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Start Point</span>
                    <span className="font-mono text-sky-500">{formatTime(startTime)}</span>
                  </div>

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
                    className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Set Start to Current Playhead
                  </button>
                </div>

                {/* End Time Control */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>End Point</span>
                    <span className="font-mono text-sky-500">{formatTime(endTime)}</span>
                  </div>

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
                    className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Set End to Current Playhead
                  </button>
                </div>

                {/* Cut Summary Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Original Length:</span>
                    <span className="font-mono">{formatTime(duration)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 dark:text-white font-bold">
                    <span className="flex items-center gap-1 text-sky-500">
                      <Clock className="w-3.5 h-3.5" /> Trimmed Length:
                    </span>
                    <span className="font-mono">{formatTime(cutDuration)}</span>
                  </div>
                </div>

                {/* Export & Download Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {!trimmedResult ? (
                    <button
                      onClick={handleTrimAndExport}
                      disabled={isExporting || cutDuration <= 0}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Processing ({exportProgress}%)
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4" /> Trim & Export Clip
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Clip Ready ({formatBytes(trimmedResult.size)})
                      </div>
                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Trimmed MP4
                      </button>
                      <button
                        onClick={() => setTrimmedResult(null)}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Adjust & Trim Again
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Native media recording • Zero compression loss</span>
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

export default VideoTrimmerView;