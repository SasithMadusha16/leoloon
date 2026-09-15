import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Shield } from 'lucide-react';

export const Navbar = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group select-none">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-500/20 dark:border-amber-400/20 bg-gradient-to-br from-amber-50/50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-0.5 shadow-sm group-hover:shadow-md group-hover:border-amber-500/40 group-hover:scale-105 transition-all duration-300 shrink-0">
            <img
              src="/logo.png"
              alt="Leoloon Logo"
              className="w-full h-full object-cover rounded-[10px]"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              LEOLOON<span className="text-amber-500">.</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Zero-Server Suite
            </span>
          </div>
        </Link>

        {/* Right Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" /> 100% Private (No Uploads)
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;