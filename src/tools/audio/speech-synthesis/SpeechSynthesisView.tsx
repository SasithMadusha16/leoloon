import { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  Sliders, 
  Languages, 
  FileText, 
  CheckCircle2, 
  Mic, 
  RotateCcw,
  Clock,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  SPEECH_PRESETS, 
  getTextStats, 
  loadBrowserVoices, 
  captureSpeechToWav,
  formatBytes,
  formatTime 
} from './engine';
import type { 
  SpeechPresetId, 
  SpeechSettings,
  AudioExportResult 
} from './engine';

const SAMPLE_TEXT = `Welcome to Leoloon. This utility runs entirely inside your browser using client-side speech synthesis. Your text never leaves your device, guaranteeing total privacy with zero latency.`;

export const SpeechSynthesisView = () => {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  
  // Settings
  const [preset, setPreset] = useState<SpeechPresetId>('natural');
  const [settings, setSettings] = useState<SpeechSettings>(SPEECH_PRESETS.natural);
  const [langFilter, setLangFilter] = useState<string>('all');

  // Playback States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Audio Recording & Export States
  const [isRecordingExport, setIsRecordingExport] = useState<boolean>(false);
  const [recordStatus, setRecordStatus] = useState<string>('');
  const [exportedAudio, setExportedAudio] = useState<AudioExportResult | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadBrowserVoices().then((loaded) => {
      if (!isMounted) return;
      setVoices(loaded);
      if (loaded.length > 0) {
        const defaultVoice = loaded.find((v) => v.default || v.lang.startsWith('en')) || loaded[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    });

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (exportedAudio?.url) {
        URL.revokeObjectURL(exportedAudio.url);
      }
    };
  }, [exportedAudio]);

  const handlePresetSelect = (id: SpeechPresetId) => {
    setPreset(id);
    setSettings(SPEECH_PRESETS[id]);
  };

  const handleSpeak = () => {
    if (!text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;

    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const chosenVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    }

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const handleStop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Record speech into standard 16-bit WAV file
  const handleRecordAndDownload = async () => {
    if (!text.trim()) return;

    setIsRecordingExport(true);
    setRecordStatus('Initializing audio recorder...');
    setExportedAudio(null);

    const chosenVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);

    try {
      const result = await captureSpeechToWav(
        text,
        chosenVoice,
        settings,
        (status) => setRecordStatus(status)
      );

      setExportedAudio(result);

      // Trigger instant automatic download
      const a = document.createElement('a');
      a.href = result.url;
      a.download = `speech-synthesis-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to capture and export audio.');
    } finally {
      setIsRecordingExport(false);
      setRecordStatus('');
    }
  };

  const stats = getTextStats(text);

  const uniqueLangs = Array.from(new Set(voices.map((v) => v.lang.split('-')[0]))).sort();

  const filteredVoices = voices.filter((v) => {
    if (langFilter === 'all') return true;
    return v.lang.startsWith(langFilter);
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Client-Side Speech Synthesis Engine & WAV Studio
            </h4>
            <span className="text-[11px] text-slate-400">
              {voices.length} Local Voices Detected • Direct High-Fidelity WAV Export
            </span>
          </div>
        </div>

        <button
          onClick={() => setText('')}
          className="text-xs font-semibold text-rose-500 hover:underline transition-colors"
        >
          Clear text
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Text Input Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-500" /> Enter Speech Script
              </label>

              <button
                onClick={() => setText(SAMPLE_TEXT)}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Load sample text
              </button>
            </div>

            <textarea
              rows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text here to generate natural speech..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y leading-relaxed font-sans"
            />

            {/* Script Statistics Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <span>{stats.words} Words</span>
                <span>{stats.chars} Characters</span>
              </div>
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-sky-500" /> ~{stats.readingTimeSecs}s reading time
              </span>
            </div>
          </div>

          {/* Quick Vocal Presets */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Vocal Delivery Presets
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'natural', label: 'Natural Voice', desc: '1.0x Speed' },
                { id: 'fast', label: 'Fast Reader', desc: '1.4x Speed' },
                { id: 'calm', label: 'Calm & Steady', desc: '0.8x Speed' },
                { id: 'animated', label: 'Animated Tone', desc: 'Pitch High' },
              ].map((p) => {
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id as SpeechPresetId)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block">{p.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Voice Parameters & Transport Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Voice Model & Dialect
            </span>

            {/* Language & Voice Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-sky-500" /> Language Filter
                </label>

                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All ({voices.length})</option>
                  {uniqueLangs.map((code) => (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {filteredVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Acoustic Sliders */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-500" /> Acoustic Parameters
              </span>

              {/* Speed / Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Speed (Rate)</span>
                  <span className="font-mono font-bold text-sky-500">{settings.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={settings.rate}
                  onChange={(e) => setSettings({ ...settings, rate: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pitch */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Pitch (Tone)</span>
                  <span className="font-mono font-bold text-sky-500">{settings.pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings.pitch}
                  onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Volume</span>
                  <span className="font-mono font-bold text-sky-500">{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => setSettings({ ...settings, volume: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Playback & Export Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              
              {/* Play / Pause / Stop row */}
              <div className="flex items-center gap-2">
                {!isSpeaking ? (
                  <button
                    onClick={handleSpeak}
                    disabled={!text.trim() || isRecordingExport}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 ml-0.5" /> {isPaused ? 'Resume Speech' : 'Synthesize & Play'}
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                )}

                <button
                  onClick={handleStop}
                  disabled={(!isSpeaking && !isPaused) || isRecordingExport}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40"
                  title="Stop Speech"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              {/* Record & Download Audio Button */}
              <button
                onClick={handleRecordAndDownload}
                disabled={isRecordingExport || !text.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isRecordingExport ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {recordStatus || 'Recording Voice Audio...'}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Record & Download Voice (.WAV)
                  </>
                )}
              </button>

              {/* Helper note for audio download */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Info className="w-3.5 h-3.5 text-emerald-500" /> How to Save Audio:
                </div>
                <p className="leading-relaxed">
                  Click <strong>Record & Download</strong>, choose <strong>Current Tab</strong> or <strong>Entire Screen</strong>, and ensure <strong>"Also share tab audio"</strong> is checked. The recording will automatically stop and download as a lossless 16-bit WAV file!
                </p>
              </div>

              {/* Animated Waveform Indicator */}
              {isSpeaking && (
                <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 flex items-center justify-between text-xs text-sky-600 dark:text-sky-400">
                  <span className="flex items-center gap-2 font-medium">
                    <Volume2 className="w-4 h-4 animate-pulse" /> Speaking in real time...
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className="w-1 bg-sky-500 rounded-full animate-bounce"
                        style={{
                          height: `${10 + (bar % 3) * 6}px`,
                          animationDelay: `${bar * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Export Success Result Box */}
              {exportedAudio && (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between text-xs animate-fadeIn">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> WAV Downloaded!
                  </span>
                  <span className="font-mono text-slate-500">
                    {formatBytes(exportedAudio.size)} • {formatTime(exportedAudio.duration)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 16-Bit PCM WAV
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Zero Server Ingestion
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SpeechSynthesisView;