import { useState, useMemo, useRef } from 'react';
import { 
  Braces, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownAZ, 
  Minimize2, 
  Maximize2, 
  Code2, 
  FileText, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { 
  validateAndParseJson, 
  formatJson, 
  minifyJson, 
  sortJsonKeys, 
  autoRepairJson, 
  jsonToTypeScript, 
  jsonToCsv 
} from './engine';

const SAMPLE_JSON = `{
  "app": "Leoloon Suite",
  "version": 2.4,
  "clientSide": true,
  "features": [
    "Video Studio",
    "Speech Synthesis",
    "QR Designer Pro",
    "JSON Formatter"
  ],
  "configuration": {
    "telemetry": false,
    "cloudUploads": 0,
    "security": {
      "encryption": "AES-GCM",
      "sandbox": true
    }
  }
}`;

// Interactive Recursive Tree Node Component
const TreeNode = ({ label, value, isLast }: { label?: string; value: any; isLast?: boolean }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (value === null) {
    return (
      <div className="font-mono text-xs py-0.5">
        {label && <span className="text-sky-600 dark:text-sky-400 font-semibold">"{label}": </span>}
        <span className="text-slate-400 italic">null</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  if (typeof value !== 'object') {
    let color = 'text-emerald-600 dark:text-emerald-400';
    if (typeof value === 'string') color = 'text-amber-600 dark:text-amber-300';
    if (typeof value === 'boolean') color = 'text-purple-600 dark:text-purple-400';

    return (
      <div className="font-mono text-xs py-0.5">
        {label && <span className="text-sky-600 dark:text-sky-400 font-semibold">"{label}": </span>}
        <span className={color}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const keys = Object.keys(value);

  return (
    <div className="font-mono text-xs py-0.5">
      <div 
        onClick={() => setCollapsed(!collapsed)} 
        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded px-1 -ml-1 inline-flex items-center gap-1 select-none"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        {label && <span className="text-sky-600 dark:text-sky-400 font-semibold">"{label}": </span>}
        <span className="text-slate-500 font-bold">{isArray ? '[' : '{'}</span>
        {collapsed && (
          <span className="text-slate-400 text-[10px] bg-slate-200 dark:bg-slate-800 px-1 rounded mx-1">
            {keys.length} items
          </span>
        )}
        {collapsed && <span className="text-slate-500 font-bold">{isArray ? ']' : '}'}</span>}
      </div>

      {!collapsed && (
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 my-0.5">
          {keys.map((k, idx) => (
            <TreeNode
              key={k}
              label={isArray ? undefined : k}
              value={value[k]}
              isLast={idx === keys.length - 1}
            />
          ))}
        </div>
      )}

      {!collapsed && (
        <span className="text-slate-500 font-bold">
          {isArray ? ']' : '}'}{!isLast && ','}
        </span>
      )}
    </div>
  );
};

export const JsonFormatterView = () => {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_JSON);
  const [indent, setIndent] = useState<2 | 4 | '\t'>(2);
  const [viewTab, setViewTab] = useState<'formatted' | 'tree' | 'typescript' | 'csv'>('formatted');
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and parse live
  const parseResult = useMemo(() => validateAndParseJson(inputJson), [inputJson]);

  // Actions
  const handleBeautify = () => {
    if (parseResult.isValid && parseResult.parsedData) {
      setInputJson(formatJson(parseResult.parsedData, indent));
    }
  };

  const handleMinify = () => {
    if (parseResult.isValid && parseResult.parsedData) {
      setInputJson(minifyJson(parseResult.parsedData));
    }
  };

  const handleSortKeys = () => {
    if (parseResult.isValid && parseResult.parsedData) {
      const sorted = sortJsonKeys(parseResult.parsedData);
      setInputJson(formatJson(sorted, indent));
    }
  };

  const handleAutoRepair = () => {
    const repaired = autoRepairJson(inputJson);
    setInputJson(repaired);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputJson(text);
    };
    reader.readAsText(file);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tsInterface = useMemo(() => {
    if (!parseResult.isValid || !parseResult.parsedData) return '';
    return jsonToTypeScript(parseResult.parsedData);
  }, [parseResult]);

  const csvOutput = useMemo(() => {
    if (!parseResult.isValid || !parseResult.parsedData) return '';
    return jsonToCsv(parseResult.parsedData);
  }, [parseResult]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <Braces className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Client-Side JSON Formatter & Developer Studio
            </h4>
            <span className="text-[11px] text-slate-400">
              Live Syntax Validator • Auto-Repair • Interactive Tree • TypeScript & CSV Exporter
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json,text/plain"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            onClick={() => setInputJson(SAMPLE_JSON)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sample
          </button>
          <button
            onClick={() => setInputJson('')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        
        {/* Quick Transformation Actions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={handleBeautify}
            disabled={!parseResult.isValid}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-40"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Beautify
          </button>

          <button
            onClick={handleMinify}
            disabled={!parseResult.isValid}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Minify
          </button>

          <button
            onClick={handleSortKeys}
            disabled={!parseResult.isValid}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" /> Sort Keys
          </button>

          <button
            onClick={handleAutoRepair}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1.5 transition-all"
            title="Fix unquoted keys, single quotes, and trailing commas"
          >
            <Wrench className="w-3.5 h-3.5" /> Auto-Repair
          </button>

          {/* Indent selector */}
          <div className="flex items-center gap-1 ml-2 text-slate-500 text-xs">
            <span>Indent:</span>
            {([2, 4] as const).map((space) => (
              <button
                key={space}
                onClick={() => setIndent(space)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  indent === space ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 text-sky-600 font-bold' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {space}s
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          {parseResult.isValid ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-4 h-4" /> Valid JSON ({parseResult.stats.keysCount} keys)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-4 h-4" /> Invalid Syntax
            </span>
          )}
        </div>

      </div>

      {/* Syntax Error Alert if invalid */}
      {!parseResult.isValid && parseResult.error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{parseResult.error.message}</span>
          </div>
          {parseResult.error.line && (
            <span className="font-mono font-bold bg-rose-500/20 px-2 py-0.5 rounded">
              Line {parseResult.error.line}, Column {parseResult.error.column}
            </span>
          )}
        </div>
      )}

      {/* Main Workspace (Editor + Output / Viewer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Editor (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[560px]">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-sky-500" /> JSON Raw Source
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {inputJson.split('\n').length} lines • {new Blob([inputJson]).size} bytes
            </span>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Paste or type raw JSON here..."
            className="flex-1 w-full p-4 text-xs font-mono bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-relaxed overflow-y-auto"
            spellCheck={false}
          />
        </div>

        {/* Output & Visualizers (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[560px]">
          
          {/* Output Navigation Header */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            
            <div className="flex items-center p-0.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg">
              {[
                { id: 'formatted', label: 'Formatted' },
                { id: 'tree', label: 'Tree View' },
                { id: 'typescript', label: 'TypeScript' },
                { id: 'csv', label: 'CSV Table' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    viewTab === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const content =
                    viewTab === 'typescript'
                      ? tsInterface
                      : viewTab === 'csv'
                      ? csvOutput
                      : parseResult.isValid
                      ? formatJson(parseResult.parsedData, indent)
                      : inputJson;
                  handleCopy(content);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={() => {
                  if (viewTab === 'typescript') {
                    handleDownload(tsInterface, 'schema.d.ts', 'text/typescript');
                  } else if (viewTab === 'csv') {
                    handleDownload(csvOutput, 'data.csv', 'text/csv');
                  } else {
                    handleDownload(
                      parseResult.isValid ? formatJson(parseResult.parsedData, indent) : inputJson,
                      'data.json',
                      'application/json'
                    );
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium inline-flex items-center gap-1 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>

          </div>

          {/* Tab Views */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            {viewTab === 'formatted' && (
              <pre className="whitespace-pre-wrap break-all">
                {parseResult.isValid && parseResult.parsedData
                  ? formatJson(parseResult.parsedData, indent)
                  : inputJson}
              </pre>
            )}

            {viewTab === 'tree' && (
              <div>
                {parseResult.isValid && parseResult.parsedData ? (
                  <TreeNode value={parseResult.parsedData} isLast={true} />
                ) : (
                  <p className="text-slate-400 italic text-center py-10">
                    Fix JSON syntax errors to explore the interactive visual tree.
                  </p>
                )}
              </div>
            )}

            {viewTab === 'typescript' && (
              <pre className="whitespace-pre-wrap text-sky-600 dark:text-sky-300">
                {tsInterface || '// Valid JSON required to generate TypeScript interfaces.'}
              </pre>
            )}

            {viewTab === 'csv' && (
              <div>
                {csvOutput ? (
                  <pre className="whitespace-pre-wrap text-emerald-600 dark:text-emerald-300">
                    {csvOutput}
                  </pre>
                ) : (
                  <p className="text-slate-400 italic text-center py-10">
                    CSV conversion works on arrays of objects (e.g. [ {`{"id": 1, "name": "Item"}`} ]).
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Analytics Footer */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4 font-mono">
          <span>Max Depth: <strong className="text-slate-800 dark:text-white">{parseResult.stats.depth}</strong></span>
          <span>Keys: <strong className="text-slate-800 dark:text-white">{parseResult.stats.keysCount}</strong></span>
          <span>Size: <strong className="text-sky-500">{parseResult.stats.sizeBytes} bytes</strong></span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>100% In-Memory Parsing • Zero Server Telemetry</span>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatterView;