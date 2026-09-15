import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Lock, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert 
} from 'lucide-react';
import { renderFirstPage, encryptPdfDocument, formatBytes } from './engine';
import type { ProtectResult } from './engine';

export const PdfProtectView = () => {
  const [file, setFile] = useState<File | null>(null);
  const [firstPageUrl, setFirstPageUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Password fields
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Permissions
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(false);
  const [allowModifying, setAllowModifying] = useState<boolean>(false);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<ProtectResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    };
  }, [result]);

  const handleFileSelect = async (incomingFile: File) => {
    if (incomingFile.type !== 'application/pdf' && !incomingFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setFile(incomingFile);
    setLoadingPreview(true);
    setResult(null);

    try {
      const preview = await renderFirstPage(incomingFile);
      setFirstPageUrl(preview);
    } catch (err) {
      console.error(err);
      alert('Failed to read document preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: 'None', color: 'bg-slate-200 dark:bg-slate-700', width: '0%' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-rose-500', width: '33%' };
    if (password.length < 10) return { label: 'Moderate', color: 'bg-amber-500', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength();
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleEncrypt = async () => {
    if (!file) return;
    if (!password) {
      alert('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please re-check.');
      return;
    }

    setProcessing(true);
    setProgressMsg('Securing pages...');

    try {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
      const res = await encryptPdfDocument(
        file,
        {
          userPassword: password,
          allowPrinting,
          allowCopying,
          allowModifying,
        },
        (curr, total) => {
          setProgressMsg(`Encrypting page ${curr} of ${total}...`);
        }
      );
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Encryption failed.');
    } finally {
      setProcessing(false);
      setProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = `${baseName}-protected.pdf`;
    link.click();
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
            accept="application/pdf"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Upload PDF to Encrypt & Protect
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Lock PDF documents with standard 128-bit encryption, custom passwords, and copy/print restrictions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} • Ready for Encryption
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setFirstPageUrl(null);
                setPassword('');
                setConfirmPassword('');
                setResult(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {/* Main Protect Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Preview / Lock Shield (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Document Shield
              </span>

              <div className="relative w-full h-[460px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
                {loadingPreview ? (
                  <div className="text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-sky-500 animate-spin mx-auto" />
                    <span className="text-xs text-slate-400">Reading document...</span>
                  </div>
                ) : firstPageUrl ? (
                  <div className="relative max-h-full max-w-full shadow-2xl rounded overflow-hidden flex items-center justify-center group">
                    <img
                      src={firstPageUrl}
                      alt="PDF First Page"
                      className="max-h-[420px] w-auto object-contain select-none"
                    />

                    {/* Lock Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center mb-3 shadow-lg">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold">Standard 128-bit Security</h4>
                      <p className="text-[11px] text-slate-300 mt-1 max-w-[200px]">
                        The recipient must enter your password to view any page.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Password & Security Configuration (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                
                {/* Password Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Set Document Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-sky-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strength.color}`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Strength: <strong className="text-slate-700 dark:text-slate-300">{strength.label}</strong></span>
                          <span>Min 6 characters recommended</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-sky-500 font-mono"
                    />

                    {confirmPassword && (
                      <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                        {passwordsMatch ? (
                          <span className="text-emerald-500 flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> Passwords match
                          </span>
                        ) : (
                          <span className="text-rose-500 flex items-center gap-1 font-medium">
                            <ShieldAlert className="w-3.5 h-3.5" /> Passwords do not match
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissions Checkbox Grid */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Security Permissions
                  </label>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowPrinting}
                        onChange={(e) => setAllowPrinting(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Allow recipients to print this PDF</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowCopying}
                        onChange={(e) => setAllowCopying(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Allow text and graphics copying</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowModifying}
                        onChange={(e) => setAllowModifying(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Allow editing or form filling</span>
                    </label>
                  </div>
                </div>

                {/* Encrypt & Download Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {!result ? (
                    <button
                      onClick={handleEncrypt}
                      disabled={processing || !passwordsMatch}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> {progressMsg || 'Encrypting Document...'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" /> Encrypt & Protect PDF
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Password Applied Successfully ({formatBytes(result.size)})
                      </div>
                      <button
                        onClick={handleDownload}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Protected PDF
                      </button>
                      <button
                        onClick={() => setResult(null)}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Change Password / Settings
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                    <span>Passcode prompt opens natively across Adobe, Chrome & iOS</span>
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