import { useState, useMemo } from 'react';
import { 
  AlignLeft, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Code, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { generateLoremText } from './engine';
import type { GeneratorUnit, TextFlavor, GeneratorOptions } from './engine';

export const LoremGeneratorView = () => {
  const [unit, setUnit] = useState<GeneratorUnit>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [flavor, setFlavor] = useState<TextFlavor>('classic');
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [wrapHtml, setWrapHtml] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [regenerateKey, setRegenerateKey] = useState<number>(0);

  const options: GeneratorOptions = useMemo(
    () => ({ unit, count, flavor, startWithLorem, wrapHtml }),
    [unit, count, flavor, startWithLorem, wrapHtml]
  );

  // Generate output on state change or regenerate trigger
  const outputText = useMemo(() => {
    // regenerateKey triggers re-calculation
    if (regenerateKey < 0) return '';
    return generateLoremText(options);
  }, [options, regenerateKey]);

  const wordsCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const charsCount = outputText.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = wrapHtml ? 'html' : 'txt';
    const mime = wrapHtml ? 'text/html' : 'text/plain';
    const blob = new Blob([outputText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorem-ipsum-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSliderMax = () => {
    if (unit === 'paragraphs') return 20;
    if (unit === 'sentences') return 30;
    if (unit === 'lists') return 25;
    return 300; // words
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <AlignLeft className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Client-Side Lorem Ipsum & Developer Dummy Generator
            </h4>
            <span className="text-[11px] text-slate-400">
              Cicero Latin • Modern Tech Buzzwords • HTML Wrappers
            </span>
          </div>
        </div>

        <button
          onClick={() => setRegenerateKey((prev) => prev + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Regenerate
        </button>
      </div>

      {/* Main Grid: Parameters (4 Cols) + Output Screen (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-500" /> Generator Options
            </span>

            {/* Unit Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Generate By
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'paragraphs', label: 'Paragraphs' },
                  { id: 'sentences', label: 'Sentences' },
                  { id: 'words', label: 'Words' },
                  { id: 'lists', label: 'List Items' },
                ].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setUnit(u.id as GeneratorUnit);
                      if (u.id === 'words' && count < 10) setCount(50);
                      if (u.id === 'paragraphs' && count > 20) setCount(3);
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                      unit === u.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Slider & Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Quantity</span>
                <span className="font-mono font-bold text-sky-500">{count} {unit}</span>
              </div>
              <input
                type="range"
                min="1"
                max={getSliderMax()}
                step="1"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Vocabulary Flavor */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" /> Text Style / Vocabulary
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFlavor('classic')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    flavor === 'classic'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs block">Classic Latin</span>
                  <span className="text-[10px] text-slate-400 font-normal">Original Cicero</span>
                </button>

                <button
                  onClick={() => setFlavor('tech')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    flavor === 'tech'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs block">Tech Buzzwords</span>
                  <span className="text-[10px] text-slate-400 font-normal">Developer Jargon</span>
                </button>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center justify-between cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <span>Start with "Lorem ipsum..."</span>
                <input
                  type="checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem(e.target.checked)}
                  className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-sky-500" /> Wrap in HTML tags
                </span>
                <input
                  type="checkbox"
                  checked={wrapHtml}
                  onChange={(e) => setWrapHtml(e.target.checked)}
                  className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

          </div>
        </div>

        {/* Output Viewer (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
            
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3 font-mono">
                <span>{wordsCount} Words</span>
                <span>{charsCount} Characters</span>
                {wrapHtml && (
                  <span className="text-sky-500 font-bold bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded text-[10px]">
                    HTML Mode
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy'}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download .{wrapHtml ? 'html' : 'txt'}
                </button>
              </div>
            </div>

            {/* Generated Output Area */}
            <div className="p-6 min-h-[420px] max-h-[560px] overflow-y-auto">
              {wrapHtml ? (
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-all">
                  {outputText}
                </pre>
              ) : (
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 font-sans whitespace-pre-wrap">
                  {outputText}
                </div>
              )}
            </div>

            {/* Output Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Instant In-Memory Generation
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Zero Telemetry • 100% Offline
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoremGeneratorView;