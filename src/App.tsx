// src/App.tsx
import { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Image, 
  FileText, 
  Code2, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Video, 
  Mic 
} from 'lucide-react';
import { TOOLS_DATA } from './data/tools';
import type { ToolCategory } from './data/tools';
import { Navbar } from './components/Navbar';
import { ToolCard } from './components/ToolCard';
import { ToolLayout } from './components/layout/ToolLayout';
import { CompressorView } from './tools/image/compressor/CompressorView';
import { ConverterView } from './tools/image/converter/ConverterView';
import { PdfMergeView } from './tools/pdf/merge/PdfMergeView';
import { PdfSplitView } from './tools/pdf/split/PdfSplitView';
import { ImageToPdfView } from './tools/pdf/image-to-pdf/ImageToPdfView';
import { PdfToImageView } from './tools/pdf/to-image/PdfToImageView';
import { PhotoEditorView } from './tools/image/editor/PhotoEditorView';
import { PdfRotateView } from './tools/pdf/rotate/PdfRotateView';
import { PdfOrganizeView } from './tools/pdf/organize/PdfOrganizeView';
import { PdfWatermarkView } from './tools/pdf/watermark/PdfWatermarkView';
import { BgRemoverView } from './tools/image/bg-remover/BgRemoverView';

// Home Dashboard View with All 6 Category Tabs
function HomeDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 6 Categories + All Filter
  const categories = [
    { id: 'all', label: 'All Utilities', icon: Layers },
    { id: 'pdf', label: 'PDF Documents', icon: FileText },
    { id: 'image', label: 'Images & AI', icon: Image },
    { id: 'video', label: 'Video Lab', icon: Video },
    { id: 'audio', label: 'Audio & Voice', icon: Mic },
    { id: 'text', label: 'Text & Writing', icon: FileText },
    { id: 'dev', label: 'Developer & Security', icon: Code2 },
  ] as const;

  const filteredTools = useMemo(() => {
    return TOOLS_DATA.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* HERO HEADER */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> 100% Client-Side • Files Never Leave Your Device
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Private, Fast & Modern <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
              Zero-Server Web Utilities
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto mb-8">
            Process images, edit PDFs, trim videos, clean audio, and run developer tools entirely inside your browser. No cloud uploads. Instant execution.
          </p>

          {/* SEARCH BAR */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 32+ utilities (e.g. compress, trim, pdf, qr)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-sm"
            />
          </div>
        </section>

        {/* ALL CATEGORY TABS (SCROLLABLE ON MOBILE) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* TOOLS GRID */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No utilities found matching "{searchQuery}".
            </p>
          </div>
        )}

        {/* PRIVACY STRIP */}
        <section className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Zero Server Ingestion</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Your files never hit any remote database or cloud storage.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Pure Client-Side Speed</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Leverages WebAssembly and Canvas for zero-latency local operations.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">GDPR & Privacy Compliant</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Safe for confidential student records, invoices, and company media.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-950 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>© 2026 Leoloon. Engineered by Advora. 100% Client-Side Processing.</p>
      </footer>
    </div>
  );
}

// Global App Routing
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeDashboard />} />
      <Route
        path="/tools/image-compressor"
        element={
          <ToolLayout
            title="Image Compressor"
            description="Compress PNG, JPG, and WebP images locally with live quality tuning and real-time size reduction stats."
            category="image"
            badge="Popular"
          >
            <CompressorView />
          </ToolLayout>
        }
      />
      <Route
        path="/tools/image-converter"
        element={
          <ToolLayout
            title="Format Converter"
            description="Convert images instantly between JPG, PNG, and next-gen WebP formats on your device."
            category="image"
          >
            <ConverterView />
          </ToolLayout>
        }
      />
      <Route
        path="/tools/pdf-merge"
        element={
          <ToolLayout
            title="PDF Merger"
            description="Combine multiple PDF files into a single document with ease."
            category="pdf"
          >
            <PdfMergeView />
          </ToolLayout>
        }
      />
      <Route
  path="/tools/pdf-merge"
  element={
    <ToolLayout
      title="PDF Merge"
      description="Combine multiple PDF documents into a single organized file in your desired order."
      category="pdf"
      badge="Essential"
    >
      <PdfMergeView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/pdf-split"
  element={
    <ToolLayout
      title="PDF Splitter"
      description="Extract specific pages or custom page ranges from any PDF document locally in your browser."
      category="pdf"
      badge="Fast"
    >
      <PdfSplitView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/image-to-pdf"
  element={
    <ToolLayout
      title="Images to PDF"
      description="Combine photos, scans, and graphic files into a single print-ready PDF document."
      category="pdf"
      badge="Popular"
    >
      <ImageToPdfView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/pdf-to-image"
  element={
    <ToolLayout
      title="PDF to JPG/PNG"
      description="Extract and convert PDF pages into high-resolution images locally in your browser."
      category="pdf"
    >
      <PdfToImageView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/photo-editor"
  element={
    <ToolLayout
      title="Photo Studio Editor"
      description="Enhance lighting, fine-tune colors, rotate, flip, and export high-resolution photos directly in your browser."
      category="image"
      badge="New"
    >
      <PhotoEditorView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/pdf-rotate"
  element={
    <ToolLayout
      title="Rotate PDF"
      description="Rotate specific pages or entire PDF documents clockwise or counter-clockwise permanently."
      category="pdf"
    >
      <PdfRotateView />
    </ToolLayout>
  }
/>
<Route
  path="/tools/pdf-organize"
  element={
    <ToolLayout
      title="Organize PDF"
      description="Rearrange page order, swap pages, and delete unwanted pages visually with live previews."
      category="pdf"
      badge="New"
    >
      <PdfOrganizeView />
    </ToolLayout>
  }
/>
<Route
  path="/tools/organize-pdf"
  element={
    <ToolLayout
      title="Organize PDF"
      description="Rearrange page order, swap pages, and delete unwanted pages visually with live previews."
      category="pdf"
      badge="New"
    >
      <PdfOrganizeView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/pdf-watermark"
  element={
    <ToolLayout
      title="PDF Watermark Studio"
      description="Protect documents by stamping text watermarks with live real-time position and opacity preview."
      category="pdf"
      badge="New"
    >
      <PdfWatermarkView />
    </ToolLayout>
  }
/>
<Route
  path="/tools/watermark-pdf"
  element={
    <ToolLayout
      title="PDF Watermark Studio"
      description="Protect documents by stamping text watermarks with live real-time position and opacity preview."
      category="pdf"
      badge="New"
    >
      <PdfWatermarkView />
    </ToolLayout>
  }
/>

<Route
  path="/tools/bg-remover"
  element={
    <ToolLayout
      title="Background Remover"
      description="Erase photo backgrounds with automatic color detection, edge smoothing, and instant transparent PNG export."
      category="image"
      badge="New"
    >
      <BgRemoverView />
    </ToolLayout>
  }
/>
<Route
  path="/tools/remove-bg"
  element={
    <ToolLayout
      title="Background Remover"
      description="Erase photo backgrounds with automatic color detection, edge smoothing, and instant transparent PNG export."
      category="image"
      badge="New"
    >
      <BgRemoverView />
    </ToolLayout>
  }
/>

    </Routes>
    
  );
}