// src/tools/utility/password-generator/PasswordGeneratorView.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Key, 
  RefreshCw, 
  Copy, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Download, 
  Layers, 
  CheckCircle2, 
  Cpu 
} from 'lucide-react';
import { 
  generateRandomPassword, 
  generatePassphrase, 
  generatePin, 
  calculateStrength 
} from './engine';
import type { 
  PasswordMode, 
  RandomPasswordOptions, 
  PassphraseOptions 
} from './engine';

export const PasswordGeneratorView = () => {
  const [mode, setMode] = useState<PasswordMode>('random');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Random Password Options
  const [randomOpts, setRandomOpts] = useState<RandomPasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });

  // Passphrase Options
  const [passphraseOpts, setPassphraseOpts] = useState<PassphraseOptions>({
    wordCount: 4,
    separator: '-',
    capitalize: true,
    includeNumber: true,
  });

  // PIN Options
  const [pinLength, setPinLength] = useState<number>(6);

  // Bulk Generator States
  const [isBulk, setIsBulk] = useState<boolean>(false);
  const [bulkCount, setBulkCount] = useState<number>(10);
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [bulkCopied, setBulkCopied] = useState<boolean>(false);

  // Generate Current Password
  const regenerate = useCallback(() => {
    let result = '';
    if (mode === 'random') {
      result = generateRandomPassword(randomOpts);
    } else if (mode === 'passphrase') {
      result = generatePassphrase(passphraseOpts);
    } else {
      result = generatePin(pinLength);
    }
    setPassword(result);

    if (isBulk) {
      const list: string[] = [];
      for (let i = 0; i < bulkCount; i++) {
        if (mode === 'random') list.push(generateRandomPassword(randomOpts));
        else if (mode === 'passphrase') list.push(generatePassphrase(passphraseOpts));
        else list.push(generatePin(pinLength));
      }
      setBulkList(list);
    }
  }, [mode, randomOpts, passphraseOpts, pinLength, isBulk, bulkCount]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Compute Strength Metrics
  const strength = useMemo(() => calculateStrength(password), [password]);

  const handleCopySingle = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBulk = () => {
    navigator.clipboard.writeText(bulkList.join('\n'));
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2000);
  };

  const handleDownloadBulk = () => {
    const blob = new Blob([bulkList.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render color-coded characters
  const renderStyledPassword = () => {
    if (!showPassword) {
      return '•'.repeat(password.length);
    }

    return password.split('').map((char, index) => {
      let color = 'text-slate-800 dark:text-slate-100';
      if (/[0-9]/.test(char)) color = 'text-amber-500 font-bold';
      else if (/[^a-zA-Z0-9]/.test(char)) color = 'text-rose-500 font-bold';
      else if (/[A-Z]/.test(char)) color = 'text-sky-600 dark:text-sky-400 font-semibold';

      return (
        <span key={index} className={color}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              CSPRNG Cryptographic Password Studio
            </h4>
            <span className="text-[11px] text-slate-400">
              Hardware WebCrypto API • Diceware Passphrases • Real-time Entropy Meter
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {[
            { id: 'random', label: 'Random' },
            { id: 'passphrase', label: 'Passphrase' },
            { id: 'pin', label: 'PIN' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as PasswordMode)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === m.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Showcase Box */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        
        {/* Output Screen */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <div className="font-mono text-lg sm:text-2xl tracking-wider select-all break-all overflow-x-auto">
            {renderStyledPassword()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={regenerate}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Generate new"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopySingle}
              className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Strength & Entropy Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Entropy Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Strength: <strong className={strength.colorClass.split(' ')[1]}>{strength.label}</strong></span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{strength.entropyBits} Bits</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-1">
              {[0, 1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-full rounded-full transition-all ${
                    step <= strength.score ? strength.colorClass.split(' ')[0] : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Time to Crack */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-sky-500" /> GPU Crack Time:
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">
              {strength.crackTimeText}
            </span>
          </div>

          {/* Security Badge */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> WebCrypto PRNG:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Hardware Secure
            </span>
          </div>
        </div>

      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-500" /> Parameter Configuration
            </span>

            {/* Random Mode Controls */}
            {mode === 'random' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Password Length</span>
                    <span className="font-mono font-bold text-sky-500">{randomOpts.length} characters</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="64"
                    value={randomOpts.length}
                    onChange={(e) => setRandomOpts({ ...randomOpts, length: Number(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomOpts.uppercase}
                      onChange={(e) => setRandomOpts({ ...randomOpts, uppercase: e.target.checked })}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>Uppercase (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomOpts.lowercase}
                      onChange={(e) => setRandomOpts({ ...randomOpts, lowercase: e.target.checked })}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>Lowercase (a-z)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomOpts.numbers}
                      onChange={(e) => setRandomOpts({ ...randomOpts, numbers: e.target.checked })}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomOpts.symbols}
                      onChange={(e) => setRandomOpts({ ...randomOpts, symbols: e.target.checked })}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>Symbols (!@#$%)</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomOpts.excludeAmbiguous}
                      onChange={(e) => setRandomOpts({ ...randomOpts, excludeAmbiguous: e.target.checked })}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <span>Exclude Ambiguous Characters (0, O, o, 1, l, I)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Passphrase Mode Controls */}
            {mode === 'passphrase' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Word Count</span>
                    <span className="font-mono font-bold text-sky-500">{passphraseOpts.wordCount} words</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={passphraseOpts.wordCount}
                    onChange={(e) => setPassphraseOpts({ ...passphraseOpts, wordCount: Number(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">Separator</label>
                    <select
                      value={passphraseOpts.separator}
                      onChange={(e) => setPassphraseOpts({ ...passphraseOpts, separator: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value="_">Underscore (_)</option>
                      <option value=".">Period (.)</option>
                      <option value=" ">Space ( )</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={passphraseOpts.capitalize}
                        onChange={(e) => setPassphraseOpts({ ...passphraseOpts, capitalize: e.target.checked })}
                        className="rounded accent-sky-500"
                      />
                      <span>Capitalize Words</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={passphraseOpts.includeNumber}
                        onChange={(e) => setPassphraseOpts({ ...passphraseOpts, includeNumber: e.target.checked })}
                        className="rounded accent-sky-500"
                      />
                      <span>Append Numbers</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PIN Mode Controls */}
            {mode === 'pin' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  PIN Digits
                </label>
                <div className="flex gap-2">
                  {[4, 6, 8, 12].map((digits) => (
                    <button
                      key={digits}
                      onClick={() => setPinLength(digits)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                        pinLength === digits
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {digits} Digits
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bulk Generation Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" /> Bulk Generator
              </span>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={isBulk}
                  onChange={(e) => setIsBulk(e.target.checked)}
                  className="rounded accent-sky-500"
                />
                <span>Enable Bulk</span>
              </label>
            </div>

            {isBulk ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Count:</span>
                  <div className="flex gap-1">
                    {[5, 10, 25, 50].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBulkCount(c)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          bulkCount === c ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                  {bulkList.map((p, idx) => (
                    <div key={idx} className="truncate text-slate-700 dark:text-slate-300">
                      {p}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyBulk}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-all"
                  >
                    {bulkCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {bulkCopied ? 'Copied All' : 'Copy All'}
                  </button>

                  <button
                    onClick={handleDownloadBulk}
                    className="py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .txt
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Check "Enable Bulk" above to generate 5 to 50 cryptographically secure credentials at once.
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero Cloud Telemetry
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" /> 100% In-Memory
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PasswordGeneratorView;