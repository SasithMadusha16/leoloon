import { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Eye, 
  Columns, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Bold, 
  Italic, 
  Heading, 
  Code, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Table, 
  Link, 
  Sparkles,
  Clock
} from 'lucide-react';
import { 
  computeDocStats, 
  parseMarkdown, 
  exportFullHtmlDocument 
} from './engine';

const SAMPLE_MARKDOWN = `# Leoloon Client-Side Suite 🚀

Leoloon provides private, local-first web utilities executing **strictly inside your browser**.

## Key Platform Features
- **Zero-Server Processing**: Documents and media never touch external clouds.
- **Instant Speed**: Near-zero network latency.
- **Total Privacy**: Built with modern WebAssembly and Canvas APIs.

### Feature Comparison Matrix
| Utility | Tech Stack | Storage |
| :--- | :--- | :--- |
| Video Trimmer | MediaStream & OffscreenCanvas | In-Memory |
| Speech Engine | Web Speech API | Client Device |
| Markdown Studio | Pure TypeScript Compiler | 100% Local |

---

### Development Tasks
- [x] Integrate client-side audio demuxers
- [x] Build multi-case text transformer
- [ ] Add PDF compression suite

> "Client-side computing transforms privacy from a luxury into a default guarantee."

\`\`\`typescript
// Quick client-side snippet
export const isZeroServer = (): boolean => {
  return true; // No telemetry, no external uploads
};
\`\`\`

Created for builders seeking *speed*, *clarity*, and *complete privacy*.
`;

export const MarkdownPreviewView = () => {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MARKDOWN);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => computeDocStats(markdown), [markdown]);
  const renderedHtml = useMemo(() => parseMarkdown(markdown), [markdown]);

  // Insert formatting snippet at cursor position
  const insertSnippet = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    const updated = markdown.substring(0, start) + replacement + markdown.substring(end);
    setMarkdown(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(renderedHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const fullHtml = exportFullHtmlDocument(markdown, renderedHtml);
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Client-Side Markdown Live Studio
            </h4>
            <span className="text-[11px] text-slate-400">
              GFM Compiler • Split Screen Preview • Standalone HTML Export
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sample
          </button>
          <button
            onClick={() => setMarkdown('')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Toolbar & View Modes */}
      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        
        {/* Action Format Pills */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => insertSnippet('**', '**')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('*', '*')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('## ')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Heading (## Title)"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('`', '`')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('- ')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Bullet List (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('1. ')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('- [ ] ')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Task List (- [ ] task)"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Table"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('[link text](', ')')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Link ([text](url))"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Split
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Editor
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>

          {/* Export Actions */}
          <button
            onClick={handleCopyHtml}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1.5 transition-all"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedHtml ? 'Copied HTML!' : 'Copy HTML'}
          </button>

          <button
            onClick={handleDownloadMd}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> .MD
          </button>

          <button
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> .HTML
          </button>
        </div>

      </div>

      {/* Main Workspace (Editor + Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[560px]">
        
        {/* Editor Column */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[560px]`}>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-500" /> Markdown Source
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {stats.lines} lines
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write your Markdown here..."
              className="flex-1 w-full p-4 text-xs font-mono bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        )}

        {/* Live Preview Column */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[560px]`}>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" /> Rendered HTML Document
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Live Preview
              </span>
            </div>

            <div
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
              className="flex-1 p-6 overflow-y-auto text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
            />
          </div>
        )}

      </div>

      {/* Footer Metrics */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4 font-mono">
          <span>{stats.words} Words</span>
          <span>{stats.chars} Characters</span>
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-500" /> ~{stats.readingTimeSecs}s Reading Time
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Pure client-side GFM parsing • Zero cloud ingestion</span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreviewView;