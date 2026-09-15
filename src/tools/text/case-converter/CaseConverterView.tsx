// src/tools/text/case-converter/CaseConverterView.tsx
import { useState } from 'react';
import { 
  Type, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Code, 
  AlignLeft, 
  CheckCircle2 
} from 'lucide-react';
import { convertCase } from './engine';
import type { CaseFormat } from './engine';

const SAMPLE_TEXT = 'leoloon zero server client-side suite for developers';

interface CaseOption {
  id: CaseFormat;
  label: string;
  example: string;
  category: 'prose' | 'dev' | 'special';
}

const CASE_OPTIONS: CaseOption[] = [
  { id: 'sentencecase', label: 'Sentence case', example: 'Sentence case text example.', category: 'prose' },
  { id: 'titlecase', label: 'Title Case', example: 'Title Case Text Example', category: 'prose' },
  { id: 'uppercase', label: 'UPPERCASE', example: 'UPPERCASE TEXT EXAMPLE', category: 'prose' },
  { id: 'lowercase', label: 'lowercase', example: 'lowercase text example', category: 'prose' },
  { id: 'camelcase', label: 'camelCase', example: 'camelCaseTextExample', category: 'dev' },
  { id: 'pascalcase', label: 'PascalCase', example: 'PascalCaseTextExample', category: 'dev' },
  { id: 'snakecase', label: 'snake_case', example: 'snake_case_text_example', category: 'dev' },
  { id: 'kebabcase', label: 'kebab-case', example: 'kebab-case-text-example', category: 'dev' },
  { id: 'constantcase', label: 'CONSTANT_CASE', example: 'CONSTANT_CASE_EXAMPLE', category: 'dev' },
  { id: 'dotcase', label: 'dot.case', example: 'dot.case.text.example', category: 'dev' },
  { id: 'alternating', label: 'aLtErNaTiNg', example: 'aLtErNaTiNg eXaMpLe', category: 'special' },
  { id: 'inverse', label: 'InVeRsE cAsE', example: 'iNvErSe CaSe ExAmPlE', category: 'special' },
];

export const CaseConverterView = () => {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyTransform = (format: CaseFormat) => {
    setText((prev) => convertCase(prev, format));
  };

  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Client-Side Case Transformer & Developer Formatter
            </h4>
            <span className="text-[11px] text-slate-400">
              12 Formats • Live Multi-Preview • Instant Clipboard Sync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setText(SAMPLE_TEXT)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sample Text
          </button>
          <button
            onClick={() => setText('')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Input Textarea */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-sky-500" /> Enter Text to Transform
          </label>
          <span className="text-xs font-mono text-slate-400">
            {words} words • {chars} characters
          </span>
        </div>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to convert across all formats in real time..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y leading-relaxed font-sans"
        />

        {/* Quick Transform Pills */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
            Click to transform editor text in-place:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CASE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleApplyTransform(opt.id)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Variations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-sky-500" /> Live Formats & One-Click Copy
          </span>
          <span className="text-[11px] text-slate-400">
            Updates in real-time as you type
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CASE_OPTIONS.map((opt) => {
            const transformed = convertCase(text, opt.id);
            const isCopied = copiedId === opt.id;

            return (
              <div
                key={opt.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {opt.label}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {opt.category}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all line-clamp-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 min-h-[44px]">
                    {transformed || <span className="text-slate-400 italic">{opt.example}</span>}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => handleApplyTransform(opt.id)}
                    className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Apply to editor
                  </button>

                  <button
                    onClick={() => handleCopy(transformed, opt.id)}
                    disabled={!transformed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pure Client-Side String Operations
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Zero Server Footprint
        </span>
      </div>
    </div>
  );
};

export default CaseConverterView;