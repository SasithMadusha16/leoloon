// src/components/ToolCard.tsx
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Tool } from '../data/tools';
import { DynamicIcon } from './DynamicIcon';

interface ToolCardProps {
  tool: Tool;
}

export const ToolCard = ({ tool }: ToolCardProps) => {
  return (
    <Link
      to={tool.path}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-sky-50 dark:group-hover:bg-sky-950/50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            <DynamicIcon name={tool.icon} className="w-5 h-5" />
          </div>
          
          {tool.badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {tool.badge}
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mb-1.5 flex items-center justify-between">
          {tool.name}
          <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span className="capitalize">{tool.category}</span>
        <span className="text-emerald-500 font-semibold">Client-Side</span>
      </div>
    </Link>
  );
};