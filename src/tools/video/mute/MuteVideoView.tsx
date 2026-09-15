// src/tools/video/mute/MuteVideoView.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  VolumeX, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  FileVideo, 
  Volume2, 
  ShieldCheck 
} from 'lucide-react';
import { 
  formatBytes, 
  formatTime, 
  stripAudioClientSide 
} from './engine';
import type { 
  MuteResult, 
  MuteProgress 
} from './engine';

export const MuteVideoView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<MuteResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mutedVideoRef = useRef<HTMLVideoElement>(null);

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

  const handleStripAudio = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      if (result?.url) URL.revokeObjectURL(result.url);

      const muteData = await stripAudioClientSide(file, (p: MuteProgress) => {
        setProgress(p.percent);
      });

      setResult(muteData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Audio removal failed.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${baseName}-muted.mp4`;
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
            Upload Video to Mute & Remove Audio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Strip all background music, dialogue, and audio streams client-side without re-encoding quality loss.
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
            
            {/* Visual Preview Player (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative w-full h-[400px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden shadow-xl">
                {videoUrl && (
                  <video
                    ref={result ? mutedVideoRef : videoRef}
                    src={result ? result.url : videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {!isPlaying && !result && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900/70 hover:bg-sky-600 text-white backdrop-blur-sm flex items-center justify-center transition-all opacity-0 hover:opacity-100 shadow-lg"
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  {result ? (
                    <>
                      <VolumeX className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Playing Muted Audio Output
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-sky-500" />
                      <span>Original Audio Stream Active</span>
                    </>
                  )}
                </span>
                <span className="font-mono">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Mute Controls & Action (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Audio Track Control
                </span>

                {/* Info Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                    <VolumeX className="w-4 h-4 text-rose-500" />
                    <span>Permanent Track Stripping</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    This removes all AAC, MP3, and Opus audio packets directly from the video stream without altering original video clarity.
                  </p>
                </div>

                {/* Features Strip */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>100% Silent Output (Zero Audio Tracks)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Full HD & 4K Resolution Preservation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                    <span>Pure In-Memory Processing (No Cloud Upload)</span>
                  </div>
                </div>

                {/* Processing Trigger & Result */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {!result ? (
                    <button
                      onClick={handleStripAudio}
                      disabled={isProcessing}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Stripping Audio ({progress}%)
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-4 h-4" /> Mute Video & Strip Audio
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Success Box */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Audio Stripped Cleanly!
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold font-mono">
                            Silent Clip
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500">New File Size:</span>
                          <span className="font-bold text-slate-800 dark:text-white font-mono text-sm">
                            {formatBytes(result.mutedSize)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Muted Video
                      </button>

                      <button
                        onClick={() => setResult(null)}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Reset & Mute Another
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Native media stream isolation • Zero server delay</span>
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

export default MuteVideoView;