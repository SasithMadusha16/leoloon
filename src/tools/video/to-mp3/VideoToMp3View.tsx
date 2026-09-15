import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Music, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Pause, 
  Sliders, 
  Headphones, 
  FileVideo 
} from 'lucide-react';
import { 
  formatBytes, 
  formatTime, 
  extractAudioFromVideo 
} from './engine';
import type { 
  AudioExtractOptions, 
  ExtractedAudioResult 
} from './engine';

export const VideoToMp3View = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Settings
  const [channels, setChannels] = useState<1 | 2>(2);
  const [sampleRate, setSampleRate] = useState<44100 | 48000>(44100);

  // Processing state
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [result, setResult] = useState<ExtractedAudioResult | null>(null);

  // Audio preview playback
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [videoUrl, result]);

  const handleFileSelect = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, WebM, MOV, MKV).');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFile(incomingFile);
    setResult(null);
    setIsPlayingAudio(false);
    setVideoUrl(URL.createObjectURL(incomingFile));
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);

    try {
      if (result?.url) URL.revokeObjectURL(result.url);

      const options: AudioExtractOptions = {
        sampleRate,
        channels,
      };

      const extracted = await extractAudioFromVideo(file, options);
      setResult(extracted);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Audio extraction failed. Video might not contain an audio track.');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${baseName}-extracted-audio.wav`;
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
            Upload Video to Extract Audio (WAV / MP3)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Extract studio-grade lossless soundtrack tracks from MP4, WebM, MOV, and MKV clips client-side.
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
                  {formatBytes(file.size)} • Client-Side Audio Demuxer
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setResult(null);
                setIsPlayingAudio(false);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Source Video (6 Cols) */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-1">
                Source Video Preview
              </span>

              <div className="relative w-full h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden shadow-md">
                {videoUrl && (
                  <video
                    src={videoUrl}
                    controls
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Audio Settings & Extraction Action (6 Cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Audio Output Parameters
                </span>

                {/* Channel Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-500" /> Channel Configuration
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setChannels(2)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        channels === 2
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs block">Stereo (2 Ch)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Full Spatial Width</span>
                    </button>

                    <button
                      onClick={() => setChannels(1)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        channels === 1
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs block">Mono (1 Ch)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Smaller File Size</span>
                    </button>
                  </div>
                </div>

                {/* Sample Rate */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Sampling Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { rate: 44100, label: '44.1 kHz', note: 'Standard CD Quality' },
                      { rate: 48000, label: '48.0 kHz', note: 'Broadcast / Pro Audio' },
                    ].map((item) => (
                      <button
                        key={item.rate}
                        onClick={() => setSampleRate(item.rate as 44100 | 48000)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          sampleRate === item.rate
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{item.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extraction Action & Player */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {!result ? (
                    <button
                      onClick={handleExtract}
                      disabled={isExtracting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Demuxing Audio Stream...
                        </>
                      ) : (
                        <>
                          <Music className="w-4 h-4" /> Extract Audio Track
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {/* Audio Player Card */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Audio Extracted Successfully
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            {formatBytes(result.size)}
                          </span>
                        </div>

                        {/* Hidden native audio element */}
                        <audio
                          ref={audioRef}
                          src={result.url}
                          onPlay={() => setIsPlayingAudio(true)}
                          onPause={() => setIsPlayingAudio(false)}
                          onTimeUpdate={() => {
                            if (audioRef.current) setAudioCurrentTime(audioRef.current.currentTime);
                          }}
                          onEnded={() => setIsPlayingAudio(false)}
                          className="hidden"
                        />

                        {/* Custom Player Scrubber */}
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={toggleAudioPlay}
                            className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
                          >
                            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          <div className="flex-1 space-y-1">
                            <input
                              type="range"
                              min="0"
                              max={result.duration || 100}
                              step="0.1"
                              value={audioCurrentTime}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setAudioCurrentTime(val);
                                if (audioRef.current) audioRef.current.currentTime = val;
                              }}
                              className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer block"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>{formatTime(audioCurrentTime)}</span>
                              <span>{formatTime(result.duration)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Headphones className="w-3.5 h-3.5 text-sky-500" />
                            {result.channels === 2 ? 'Stereo' : 'Mono'} • {result.sampleRate / 1000} kHz
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            16-bit Lossless PCM
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download WAV Audio
                      </button>

                      <button
                        onClick={() => {
                          setResult(null);
                          setIsPlayingAudio(false);
                        }}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Extract with different parameters
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Pure Web Audio API demuxing • Zero conversion lag</span>
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

export default VideoToMp3View;