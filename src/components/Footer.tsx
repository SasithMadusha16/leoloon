import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  ArrowUp, 
  FileText, 
  Image as ImageIcon, 
  Code2, 
  CheckCircle2, 
  Sparkles,
  Zap,
  HardDrive
} from 'lucide-react';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full border-t border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-900 text-slate-600 dark:text-slate-400 transition-colors overflow-hidden">
      
      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Security & Architecture Highlights */}
      <div className="relative border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  100% In-Memory Execution
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Files stay strictly inside your local device's RAM memory with zero server telemetry.
                </p>
              </div>
            </div>

            <div className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 hover:border-sky-500/40 dark:hover:border-sky-500/40 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  WebAssembly & Hardware Core
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Near-native execution speed accelerated by client-side browser pipelines.
                </p>
              </div>
            </div>

            <div className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  Cryptographic Grade
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Protected by W3C WebCrypto CSPRNG & zero persistent trace guarantees.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Navigation & Tool Architecture Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Info & Mission (4 Columns) */}
          <div className="md:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3.5 group select-none">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/30 dark:border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-slate-100 to-slate-200 dark:from-amber-500/20 dark:via-slate-900 dark:to-slate-950 p-0.5 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-all duration-300 shrink-0">
                <img
                  src="/logo.png"
                  alt="Leoloon Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  LEOLOON<span className="text-amber-500">.</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                  Zero-Server Suite
                </span>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-sm">
              An uncompromising, privacy-centric web utility ecosystem. Designed for developers, creators, and professionals who demand instant client-side execution with zero cloud storage footprint.
            </p>

            {/* Architecture Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Zap className="w-3 h-3 text-amber-500" /> WebAssembly
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <HardDrive className="w-3 h-3 text-sky-500" /> Local Sandbox
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3 h-3 text-emerald-500" /> 100% Free
              </span>
            </div>

            {/* Status Beacon */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Engine Modules Operational & Offline Ready</span>
            </div>
          </div>

          {/* Column 1: PDF Documents (2 Columns) */}
          <div className="md:col-span-2 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-500" /> PDF Suite
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tools/pdf-merge" className="hover:text-sky-500 dark:hover:text-sky-400 hover:translate-x-1 inline-block transition-all">
                  PDF Merge
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-split" className="hover:text-sky-500 dark:hover:text-sky-400 hover:translate-x-1 inline-block transition-all">
                  PDF Splitter
                </Link>
              </li>
              <li>
                <Link to="/tools/image-to-pdf" className="hover:text-sky-500 dark:hover:text-sky-400 hover:translate-x-1 inline-block transition-all">
                  Images to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-watermark" className="hover:text-sky-500 dark:hover:text-sky-400 hover:translate-x-1 inline-block transition-all">
                  PDF Watermark
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-protect" className="hover:text-sky-500 dark:hover:text-sky-400 hover:translate-x-1 inline-block transition-all">
                  Encrypt & Protect
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-organize" className="hover:text-sky-500 dark:hover:text-sky-400 hover:translate-x-1 inline-block transition-all">
                  Page Sequence Manager
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Media & Video (2 Columns) */}
          <div className="md:col-span-2 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Media & Video
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tools/image-compressor" className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Image Compressor
                </Link>
              </li>
              <li>
                <Link to="/tools/bg-remover" className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  AI Background Remover
                </Link>
              </li>
              <li>
                <Link to="/tools/video-trimmer" className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Video Trimmer
                </Link>
              </li>
              <li>
                <Link to="/tools/video-to-mp3" className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Lossless Audio Ripper
                </Link>
              </li>
              <li>
                <Link to="/tools/photo-editor" className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Photo Studio Pro
                </Link>
              </li>
              <li>
                <Link to="/tools/voice-enhancer" className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  AI Voice Enhancer
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer Tools (2 Columns) */}
          <div className="md:col-span-2 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-amber-500" /> Developer Hub
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tools/qr-studio" className="hover:text-amber-500 dark:hover:text-amber-400 hover:translate-x-1 inline-block transition-all">
                  QR Studio Pro
                </Link>
              </li>
              <li>
                <Link to="/tools/json-formatter" className="hover:text-amber-500 dark:hover:text-amber-400 hover:translate-x-1 inline-block transition-all">
                  JSON Formatter
                </Link>
              </li>
              <li>
                <Link to="/tools/base64" className="hover:text-amber-500 dark:hover:text-amber-400 hover:translate-x-1 inline-block transition-all">
                  Base64 Studio
                </Link>
              </li>
              <li>
                <Link to="/tools/password-generator" className="hover:text-amber-500 dark:hover:text-amber-400 hover:translate-x-1 inline-block transition-all">
                  CSPRNG Passwords
                </Link>
              </li>
              <li>
                <Link to="/tools/markdown-preview" className="hover:text-amber-500 dark:hover:text-amber-400 hover:translate-x-1 inline-block transition-all">
                  Markdown Live Studio
                </Link>
              </li>
              <li>
                <Link to="/tools/case-converter" className="hover:text-amber-500 dark:hover:text-amber-400 hover:translate-x-1 inline-block transition-all">
                  Text Case Transformer
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Architecture Guarantees (2 Columns) */}
          <div className="md:col-span-2 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Standards
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero Server Uploads</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No User Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited Free Access</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Offline Compatible</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Legal, Crafted Note & Back to Top Strip */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 bg-slate-100/50 dark:bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
          
          {/* Left: Copyright, Advora Credit & Tagline */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              © 2026 Leoloon.
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            
            <span>
              Engineered by{' '}
              <a
                href="https://www.advora.lk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 bg-clip-text text-transparent hover:brightness-125 transition-all underline decoration-amber-500/30 hover:decoration-amber-500 underline-offset-4"
              >
                Advora
              </a>
            </span>

            <span className="hidden lg:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Private by design. Instant by nature.
            </span>
          </div>

          {/* Right: Privacy, Terms & Back to Top */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              <Link 
                to="/privacy" 
                className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors hover:underline underline-offset-4 decoration-amber-500/40"
              >
                Privacy Policy
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link 
                to="/terms" 
                className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors hover:underline underline-offset-4 decoration-amber-500/40"
              >
                Terms of Service
              </Link>
            </div>

            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-xs hover:shadow-md transition-all font-semibold text-slate-700 dark:text-slate-200 text-xs"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5 text-amber-500 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;