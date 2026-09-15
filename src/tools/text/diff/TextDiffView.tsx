// src/tools/text/diff/TextDiffView.tsx
import { useState, useMemo } from 'react';
import { 
  GitCompare, 
  RotateCcw, 
  Copy, 
  Check, 
  Plus, 
  Minus, 
  Sparkles, 
  Sliders, 
  Columns, 
  ListFilter 
} from 'lucide-react';
import { computeDiff } from './engine';

const SAMPLE_ORIGINAL = `// User Session Configuration
const config = {
  appName: "Leoloon Suite",
  version: "1.0.0",
  environment: "development",
  maxUploadSizeMb: 50,
  enableCloudSync: true,
  allowedFormats: ["mp4", "jpg", "pdf"]
};

export default config;`;

const SAMPLE_MODIFIED = `// User Session Configuration
const config = {
  appName: "Leoloon Zero-Server Suite",
  version: "1.2.0",
  environment: "production",
  maxUploadSizeMb: 0, // Zero server storage
  enableCloudSync: false,
  allowedFormats: ["mp4", "jpg", "pdf", "wav", "gif"]
};

export default config;`;

export const TextDiffView = () => {
  const [originalText, setOriginalText] = useState(SAMPLE_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(SAMPLE_MODIFIED);

  // Settings
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [copied, setCopied] = useState(false);

  const { lines, stats } = useMemo(() => {
    return computeDiff(originalText, modifiedText, {
      ignoreWhitespace,
      ignoreCase,
    });
  }, [originalText, modifiedText, ignoreWhitespace, ignoreCase]);

  const handleCopyDiff = () => {
    const formatted = lines
      .map((l) => {
        const prefix = l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ';
        return `${prefix}${l.text}`;
      })
      .join('\n');

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
  };

  const handleLoadSample = () => {
    setOriginalText(SAMPLE_ORIGINAL);
    setModifiedText(SAMPLE_MODIFIED);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Instant Text & Code Diff Comparator
            </h4>
            <span className="text-[11px] text-slate-400">
              100% Client-Side LCS Engine • Side-by-Side & Unified Comparison
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sample Text
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-500 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Input Editors (Two Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Original Document (Left)
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {originalText.split(/\r?\n/).length} lines
            </span>
          </div>
          <textarea
            rows={8}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste original text or code here..."
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed resize-y"
          />
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Modified Document (Right)
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {modifiedText.split(/\r?\n/).length} lines
            </span>
          </div>
          <textarea
            rows={8}
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Paste modified text or code here..."
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed resize-y"
          />
        </div>
      </div>

      {/* Diff Toolbar & Analytics */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Comparison Stats */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
            <Plus className="w-3.5 h-3.5" /> {stats.additions} Additions
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
            <Minus className="w-3.5 h-3.5" /> {stats.deletions} Deletions
          </span>
          <span className="text-slate-600 dark:text-slate-400 font-normal">
            Similarity: <strong className="text-sky-500 font-mono">{stats.similarity}%</strong>
          </span>
        </div>

        {/* Options & View Mode */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Split View
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'unified'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Unified View
            </button>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded accent-sky-500"
            />
            <span>Ignore Whitespace</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
              className="rounded accent-sky-500"
            />
            <span>Ignore Case</span>
          </label>

          <button
            onClick={handleCopyDiff}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Diff!' : 'Copy Diff'}
          </button>
        </div>
      </div>

      {/* Diff Result Viewer */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-500" /> Visual Difference Viewer
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {lines.length} total stream tokens
          </span>
        </div>

        {lines.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Paste text into both boxes to see side-by-side comparison.
          </div>
        ) : viewMode === 'unified' ? (
          /* UNIFIED VIEW */
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40 font-mono text-xs overflow-x-auto">
            {lines.map((l, index) => {
              const isAdd = l.type === 'added';
              const isRem = l.type === 'removed';
              return (
                <div
                  key={index}
                  className={`flex items-stretch px-3 py-1 ${
                    isAdd
                      ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
                      : isRem
                      ? 'bg-rose-500/10 text-rose-900 dark:text-rose-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <span className="w-10 shrink-0 text-[11px] text-slate-400 select-none text-right pr-3 border-r border-slate-200 dark:border-slate-800">
                    {l.oldLineNumber || ''}
                  </span>
                  <span className="w-10 shrink-0 text-[11px] text-slate-400 select-none text-right pr-3 border-r border-slate-200 dark:border-slate-800">
                    {l.newLineNumber || ''}
                  </span>
                  <span className="w-6 shrink-0 text-center font-bold select-none">
                    {isAdd ? '+' : isRem ? '-' : ' '}
                  </span>
                  <pre className="flex-1 whitespace-pre-wrap font-mono break-all">{l.text || ' '}</pre>
                </div>
              );
            })}
          </div>
        ) : (
          /* SPLIT (SIDE-BY-SIDE) VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 font-mono text-xs overflow-x-auto">
            {/* Left Column (Original/Deletions) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {lines.map((l, index) => {
                if (l.type === 'added') {
                  return (
                    <div key={index} className="flex px-3 py-1 bg-slate-50/30 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 select-none">
                      <span className="w-10 shrink-0 text-[11px] text-right pr-3 border-r border-slate-200 dark:border-slate-800"> </span>
                      <span className="flex-1"> </span>
                    </div>
                  );
                }
                const isRem = l.type === 'removed';
                return (
                  <div
                    key={index}
                    className={`flex items-stretch px-3 py-1 ${
                      isRem
                        ? 'bg-rose-500/10 text-rose-900 dark:text-rose-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-10 shrink-0 text-[11px] text-slate-400 select-none text-right pr-3 border-r border-slate-200 dark:border-slate-800">
                      {l.oldLineNumber || ''}
                    </span>
                    <span className="w-5 shrink-0 text-center font-bold select-none text-rose-500">
                      {isRem ? '-' : ' '}
                    </span>
                    <pre className="flex-1 whitespace-pre-wrap font-mono break-all">{l.text || ' '}</pre>
                  </div>
                );
              })}
            </div>

            {/* Right Column (Modified/Additions) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {lines.map((l, index) => {
                if (l.type === 'removed') {
                  return (
                    <div key={index} className="flex px-3 py-1 bg-slate-50/30 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 select-none">
                      <span className="w-10 shrink-0 text-[11px] text-right pr-3 border-r border-slate-200 dark:border-slate-800"> </span>
                      <span className="flex-1"> </span>
                    </div>
                  );
                }
                const isAdd = l.type === 'added';
                return (
                  <div
                    key={index}
                    className={`flex items-stretch px-3 py-1 ${
                      isAdd
                        ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-10 shrink-0 text-[11px] text-slate-400 select-none text-right pr-3 border-r border-slate-200 dark:border-slate-800">
                      {l.newLineNumber || ''}
                    </span>
                    <span className="w-5 shrink-0 text-center font-bold select-none text-emerald-500">
                      {isAdd ? '+' : ' '}
                    </span>
                    <pre className="flex-1 whitespace-pre-wrap font-mono break-all">{l.text || ' '}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Longest Common Subsequence (LCS) Matrix
          </span>
          <span>Zero Server Uploads • In-Memory Processing</span>
        </div>
      </div>
    </div>
  );
};

export default TextDiffView;