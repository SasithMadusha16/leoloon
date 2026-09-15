// src/tools/text/word-counter/WordCounterView.tsx
import { useState, useMemo } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  RotateCcw, 
  Clock, 
  Mic, 
  BarChart2, 
  Sparkles, 
  Type, 
  Share2 
} from 'lucide-react';
import { 
  computeTextStats, 
  computeKeywordDensity, 
  computeSocialLimits, 
  formatDuration, 
  transformCase 
} from './engine';

const SAMPLE_TEXT = `Leoloon is an open, private collection of browser-based utilities. Every image transformation, document manipulation, and audio rendering routine runs strictly inside local memory. 

By avoiding cloud uploads, documents retain complete privacy while executing with near-zero network latency. Explore our fast, local-first web utilities today.`;

export const WordCounterView = () => {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [copied, setCopied] = useState<boolean>(false);

  const stats = useMemo(() => computeTextStats(text), [text]);
  const keywords = useMemo(() => computeKeywordDensity(text), [text]);
  const socialLimits = useMemo(() => computeSocialLimits(stats.chars), [stats.chars]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTransform = (type: 'upper' | 'lower' | 'title' | 'sentence' | 'clean') => {
    setText((prev) => transformCase(prev, type));
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5"/>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Word & Character Intelligence Counter
            </h4>
            <span className="text-[11px] text-slate-400">
              Live Text Density • Reading Estimates • Zero Server Transmission
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setText(SAMPLE_TEXT)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5"/> Sample Text
          </button>
          <button
            onClick={() => setText('')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Words', value: stats.words, highlight: 'text-sky-500' },
          { label: 'Characters', value: stats.chars, highlight: 'text-slate-800 dark:text-white' },
          { label: 'Chars (No Spaces)', value: stats.charsNoSpaces, highlight: 'text-slate-800 dark:text-white' },
          { label: 'Sentences', value: stats.sentences, highlight: 'text-slate-800 dark:text-white' },
          { label: 'Paragraphs', value: stats.paragraphs, highlight: 'text-slate-800 dark:text-white' },
          { label: 'Avg Word Length', value: `${stats.avgWordLength} ch`, highlight: 'text-indigo-500' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center"
          >
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              {item.label}
            </span>
            <span className={`text-xl font-mono font-extrabold ${item.highlight}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor & Case Modifiers (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            
            {/* Action Bar (Case Changers) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-sky-500"/> Quick Case Tools
              </span>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => applyTransform('sentence')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  Sentence case
                </button>
                <button
                  onClick={() => applyTransform('title')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  Title Case
                </button>
                <button
                  onClick={() => applyTransform('upper')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  UPPERCASE
                </button>
                <button
                  onClick={() => applyTransform('lower')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  lowercase
                </button>
                <button
                  onClick={() => applyTransform('clean')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-medium transition-colors"
                >
                  Trim Whitespace
                </button>
              </div>
            </div>

            {/* Input Textarea */}
            <textarea
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text here to see real-time character, word, sentence, and social limits..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y leading-relaxed font-sans"
            />

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-mono">
                {stats.words} words • {stats.chars} chars
              </span>

              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500"/> : <Copy className="w-3.5 h-3.5"/>}
                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>
            </div>

          </div>
        </div>

        {/* Intelligence Side Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Reading & Speaking Estimates */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Auditory & Delivery Times
            </span>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-500"/> Silent Reading
                </span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-white block">
                  ~{formatDuration(stats.readingTimeSecs)}
                </span>
                <span className="text-[10px] text-slate-400">@ 200 WPM</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-indigo-500"/> Speaking Voice
                </span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-white block">
                  ~{formatDuration(stats.speakingTimeSecs)}
                </span>
                <span className="text-[10px] text-slate-400">@ 130 WPM</span>
              </div>
            </div>
          </div>

          {/* Social Media & Search Constraints */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-sky-500"/> Target Limits
            </span>

            <div className="space-y-3">
              {socialLimits.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                    <span className={`font-mono font-bold ${item.isOver ? 'text-rose-500' : 'text-slate-400'}`}>
                      {item.current} / {item.max}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.isOver ? 'bg-rose-500' : item.percent > 85 ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Density Analysis */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-sky-500"/> Keyword Frequency
            </span>

            {keywords.length > 0 ? (
              <div className="space-y-2 pt-1">
                {keywords.map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {kw.word}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{kw.count}x</span>
                      <span className="font-mono font-bold text-sky-500 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded text-[10px]">
                        {kw.density}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[11px] text-slate-400 py-2">
                Type more words to view top keyword density.
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-500"/>
            <span>Real-time local lexical analysis</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default WordCounterView;