import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Mic, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Pause, 
  Sliders, 
  Radio, 
  Zap, 
  Volume2, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { 
  formatBytes, 
  formatTime, 
  PRESET_CONFIGS, 
  enhanceAudioClientSide 
} from './engine';
import type { 
  EnhancerPresetId, 
  EnhancerSettings, 
  EnhanceResult 
} from './engine';

export const VoiceEnhancerView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // Settings
  const [preset, setPreset] = useState<EnhancerPresetId>('podcast');
  const [settings, setSettings] = useState<EnhancerSettings>(PRESET_CONFIGS.podcast);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<EnhanceResult | null>(null);

  // Audio Playback & A/B testing
  const [activePlayback, setActivePlayback] = useState<'original' | 'enhanced'>('enhanced');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [originalUrl, result]);

  const handleFileSelect = (incomingFile: File) => {
    if (!incomingFile.type.startsWith('audio/') && !incomingFile.type.startsWith('video/')) {
      alert('Please upload a valid audio or video file (MP3, WAV, M4A, AAC, WebM).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFile(incomingFile);
    setResult(null);
    setIsPlaying(false);
    setOriginalUrl(URL.createObjectURL(incomingFile));
  };

  const handlePresetSelect = (id: EnhancerPresetId) => {
    setPreset(id);
    setSettings(PRESET_CONFIGS[id]);
  };

  const handleEnhance = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      if (result?.url) URL.revokeObjectURL(result.url);

      const enhanced = await enhanceAudioClientSide(file, settings);
      setResult(enhanced);
      setActivePlayback('enhanced');
      setIsPlaying(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Enhancement failed. Please check the file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const switchPlaybackSource = (source: 'original' | 'enhanced') => {
    if (!audioRef.current) return;
    const wasPlaying = !audioRef.current.paused;
    const currentPos = audioRef.current.currentTime;

    setActivePlayback(source);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = currentPos;
        if (wasPlaying) {
          audioRef.current.play();
        }
      }
    }, 50);
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${baseName}-${preset}-enhanced.wav`;
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
            accept="audio/*,video/*"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload Voice or Audio to Enhance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Clean microphone rumble, boost vocal clarity, level audio dynamics, and remove pause hiss with 100% client-side Web Audio DSP.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} • Client-Side Neural DSP Voice Master
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setOriginalUrl(null);
                setResult(null);
                setIsPlaying(false);
              }}
              className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Presets & Tuning (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Studio Vocal Profiles
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'podcast',
                      title: 'Podcast Studio',
                      icon: Radio,
                      badge: 'Recommended',
                      desc: 'Warm, radio-ready sound with balanced compression and vocal presence.',
                    },
                    {
                      id: 'crisp',
                      title: 'Crisp & Clear',
                      icon: Zap,
                      badge: 'High Clarity',
                      desc: 'Eliminates boominess and cuts muffled tones for clear speech.',
                    },
                    {
                      id: 'warm',
                      title: 'Warm & Deep',
                      icon: Volume2,
                      badge: 'Voice-Over',
                      desc: 'Rich low-mids and gentle smoothing for voice acting and audiobooks.',
                    },
                    {
                      id: 'de-noise',
                      title: 'Noise Dampen',
                      icon: ShieldCheck,
                      badge: 'Focus',
                      desc: 'Aggressive low-end rumble cut and pause gating for noisy rooms.',
                    },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = preset === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePresetSelect(p.id as EnhancerPresetId)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-500' : 'text-slate-400'}`} />
                            {p.title}
                          </span>
                          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 rounded">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Fine-tuning parameters */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-500" /> Active DSP Parameters
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Low-Cut Rumble:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-white">{settings.lowCutFreq} Hz</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Vocal Presence:</span>
                        <span className="font-mono font-bold text-sky-500">+{settings.presenceGain} dB</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Air & Brilliance:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-white">+{settings.airGain} dB</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Dynamic Leveling:</span>
                        <span className="font-mono font-bold text-indigo-500">{settings.compressorRatio}:1 Ratio</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleEnhance}
                  disabled={isProcessing}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Mastering Voice Audio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Apply Studio Enhancement
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* A/B Player & Download (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Studio A/B Master Player
                </span>

                {/* Hidden Audio element for playback */}
                <audio
                  ref={audioRef}
                  src={activePlayback === 'enhanced' && result ? result.url : (originalUrl || '')}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setDuration(audioRef.current.duration);
                  }}
                  onTimeUpdate={() => {
                    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                {/* A/B Switcher Pills */}
                <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-1 text-center">
                  <button
                    onClick={() => switchPlaybackSource('original')}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      activePlayback === 'original'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Original Audio
                  </button>

                  <button
                    onClick={() => switchPlaybackSource('enhanced')}
                    disabled={!result}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      activePlayback === 'enhanced' && result
                        ? 'bg-sky-600 text-white shadow-sm'
                        : result
                        ? 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        : 'opacity-40 cursor-not-allowed text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Enhanced Studio
                  </button>
                </div>

                {/* Player Scrubber & Transport Controls */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 transition-all"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCurrentTime(val);
                          if (audioRef.current) audioRef.current.currentTime = val;
                        }}
                        className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer block"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-400">
                    <span>
                      Now auditioning:{' '}
                      <strong className={activePlayback === 'enhanced' ? 'text-sky-500' : 'text-slate-600 dark:text-slate-300'}>
                        {activePlayback === 'enhanced' ? 'Mastered Output' : 'Raw Audio'}
                      </strong>
                    </span>
                    <button
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = 0;
                      }}
                      className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restart
                    </button>
                  </div>
                </div>

                {/* Export Card */}
                {result ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Ready for Studio Export
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">{formatBytes(result.size)}</span>
                    </div>

                    <button
                      onClick={handleDownload}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" /> Download 16-Bit WAV Master
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-[11px] text-slate-400">
                    Click "Apply Studio Enhancement" above to generate your enhanced track.
                  </p>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>100% In-memory DSP • No audio stored on cloud</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceEnhancerView;