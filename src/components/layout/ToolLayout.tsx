// src/components/layout/ToolLayout.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { Navbar } from '../Navbar';

interface ToolLayoutProps {
  title: string;
  description: string;
  category: string;
  badge?: string;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  description,
  category,
  badge,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Utilities
          </Link>
        </div>

        {/* Tool Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-500/20 capitalize">
                {category} Tool
              </span>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {badge}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {description}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 self-start md:self-auto px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Server • Runs on Device</span>
          </div>
        </div>

        {/* Tool Workspace (Active Tool Body) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          {children}
        </div>

        {/* Trust & Performance Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
          <Zap className="w-3.5 h-3.5 text-sky-500" />
          <span>No file size limits. All compression is executed in your browser's memory.</span>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-950 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>© 2026 Leoloon. Engineered by Advora. 100% Client-Side Processing.</p>
      </footer>
    </div>
  );
};