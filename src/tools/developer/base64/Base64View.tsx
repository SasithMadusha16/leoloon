import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Binary, 
  UploadCloud, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  Sparkles, 
  Code, 
  FileText, 
  Image as ImageIcon, 
  ArrowRightLeft, 
  AlertTriangle, 
  Eye, 
  CheckCircle2 
} from 'lucide-react';
import { 
  encodeUtf8Base64, 
  decodeUtf8Base64, 
  fileToBase64, 
  base64ToBlob, 
  formatBytes 
} from './engine';

const SAMPLE_TEXT = `Hello Leoloon! 🚀
This tool provides 100% client-side Base64 conversion with complete UTF-8 support for unicode, emojis & scripts (සිංහල, தமிழ்).`;

export const Base64View = () => {
  // Navigation Tabs: 'text' or 'file'
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');

  // Text Mode States
  const [textMode, setTextMode] = useState<'encode' | 'decode'>('encode');
  const [textInput, setTextInput] = useState<string>(SAMPLE_TEXT);
  const [urlSafe, setUrlSafe] = useState<boolean>(false);

  // File Mode States
  const [fileData, setFileData] = useState<{
    name: string;
    size: number;
    mimeType: string;
    dataUri: string;
    rawBase64: string;
  } | null>(null);
  const [snippetType, setSnippetType] = useState<'raw' | 'dataUri' | 'img' | 'css'>('dataUri');

  // Base64 to File Decoder State
  const [decodeBase64Input, setDecodeBase64Input] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Compute Text Conversion Live
  const textOutput = useMemo(() => {
    if (textMode === 'encode') {
      return {
        result: encodeUtf8Base64(textInput, urlSafe),
        error: null,
      };
    } else {
      const res = decodeUtf8Base64(textInput);
      return {
        result: res.text,
        error: res.error || null,
      };
    }
  }, [textInput, textMode, urlSafe]);

  const handleSwapText = () => {
    if (textOutput.result && !textOutput.error) {
      setTextInput(textOutput.result);
      setTextMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const res = await fileToBase64(file);
      setFileData({
        name: file.name,
        size: res.size,
        mimeType: res.mimeType,
        dataUri: res.dataUri,
        rawBase64: res.rawBase64,
      });
    } catch {
      alert('Failed to read file.');
    }
  };

  const handleDecodeInputToPreview = (val: string) => {
    setDecodeBase64Input(val);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!val.trim()) {
      setPreviewUrl(null);
      return;
    }

    const res = base64ToBlob(val);
    if (res.blob) {
      setPreviewUrl(URL.createObjectURL(res.blob));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Build snippet for File mode
  const getFileSnippet = () => {
    if (!fileData) return '';
    switch (snippetType) {
      case 'raw':
        return fileData.rawBase64;
      case 'img':
        return `<img src="${fileData.dataUri}" alt="${fileData.name}" />`;
      case 'css':
        return `background-image: url("${fileData.dataUri}");`;
      case 'dataUri':
      default:
        return fileData.dataUri;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Client-Side Base64 Studio & Media Encoder
            </h4>
            <span className="text-[11px] text-slate-400">
              Unicode / UTF-8 Safe • URL-Safe Option • Image to Data URI & HTML Snippets
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Text Converter
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> File & Image Encoder
          </button>
        </div>
      </div>

      {activeTab === 'text' ? (
        /* ==================== TEXT CONVERTER TAB ==================== */
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setTextMode('encode')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    textMode === 'encode'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Encode to Base64
                </button>
                <button
                  onClick={() => setTextMode('decode')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    textMode === 'decode'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Decode from Base64
                </button>
              </div>

              {textMode === 'encode' && (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none ml-2">
                  <input
                    type="checkbox"
                    checked={urlSafe}
                    onChange={(e) => setUrlSafe(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                  <span>URL-Safe Base64</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSwapText}
                disabled={!textOutput.result || !!textOutput.error}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-all disabled:opacity-40"
                title="Swap input with output"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Swap
              </button>
              <button
                onClick={() => setTextInput(SAMPLE_TEXT)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Sample
              </button>
              <button
                onClick={() => setTextInput('')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 text-xs font-medium transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Syntax Error Alert on Decode */}
          {textMode === 'decode' && textOutput.error && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{textOutput.error}</span>
            </div>
          )}

          {/* Split Editor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[420px]">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider">
                  {textMode === 'encode' ? 'Plain Text Source' : 'Base64 Encoded Input'}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {textInput.length} chars • {new Blob([textInput]).size} bytes
                </span>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={textMode === 'encode' ? 'Type or paste plain text here...' : 'Paste Base64 string here...'}
                className="flex-1 w-full p-4 text-xs font-mono bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-relaxed overflow-y-auto"
              />
            </div>

            {/* Output Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[420px]">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider">
                  {textMode === 'encode' ? 'Base64 Result' : 'Decoded Plain Text'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(textOutput.result)}
                    disabled={!textOutput.result}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownloadText(textOutput.result, textMode === 'encode' ? 'encoded.b64' : 'decoded.txt')}
                    disabled={!textOutput.result}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium inline-flex items-center gap-1 shadow-sm transition-all disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={textOutput.result}
                placeholder="Result will appear here..."
                className="flex-1 w-full p-4 text-xs font-mono bg-slate-50/50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 focus:outline-none resize-none leading-relaxed overflow-y-auto"
              />
            </div>

          </div>

        </div>
      ) : (
        /* ==================== FILE & MEDIA ENCODER TAB ==================== */
        <div className="space-y-6">
          
          {/* File Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-500 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Upload Image, Audio, or Any File to Convert to Base64
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              PNG, JPG, SVG, WebP, PDF, MP3. Encoded strictly inside memory with 0 server uploads.
            </p>
          </div>

          {/* If file is encoded */}
          {fileData && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
              
              {/* File details & overhead stats */}
              <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  {fileData.mimeType.startsWith('image/') ? (
                    <img
                      src={fileData.dataUri}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-contain border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-0.5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-500 flex items-center justify-center font-mono font-bold text-xs">
                      FILE
                    </div>
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[260px]">
                      {fileData.name}
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Original: <strong>{formatBytes(fileData.size)}</strong> • Base64: <strong>{formatBytes(fileData.dataUri.length)}</strong> (+33% overhead)
                    </span>
                  </div>
                </div>

                {/* Code Snippet Pill Selector */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  {[
                    { id: 'dataUri', label: 'Data URI' },
                    { id: 'raw', label: 'Raw Base64' },
                    { id: 'img', label: 'HTML <img>' },
                    { id: 'css', label: 'CSS Background' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSnippetType(s.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        snippetType === s.id
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={6}
                  value={getFileSnippet()}
                  className="w-full p-4 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none resize-none leading-relaxed"
                />
                <button
                  onClick={() => handleCopy(getFileSnippet())}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Snippet' : 'Copy'}
                </button>
              </div>

            </div>
          )}

          {/* Decode Base64 string back to downloadable file */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-500" /> Decode Base64 Data URI into File Preview
            </span>

            <textarea
              rows={3}
              value={decodeBase64Input}
              onChange={(e) => handleDecodeInputToPreview(e.target.value)}
              placeholder="Paste Base64 string or data:image/png;base64,... to reconstruct file..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            />

            {previewUrl && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Decoded Preview"
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reconstructed File Ready
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      100% In-Memory binary Blob reconstruction
                    </span>
                  </div>
                </div>

                <a
                  href={previewUrl}
                  download={`decoded-file-${Date.now()}`}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download Decoded File
                </a>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Analytics Footer */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Code className="w-3.5 h-3.5 text-sky-500" />
          <span>RFC 4648 Compliant • Unicode TextEncoder/TextDecoder Standard</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Zero Server Uploads • In-Memory Processing</span>
        </div>
      </div>
    </div>
  );
};

export default Base64View;