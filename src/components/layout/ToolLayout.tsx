import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import type { ToolCategory } from '../../data/tools';


interface ToolLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  category?: ToolCategory | string;
  badge?: string;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  children,
  title,
  description,
  badge,
}) => {
  const location = useLocation();
  const currentUrl = `https://leoloon.com${location.pathname}`;

  const seoTitle = `Free ${title} Online - 100% Private & No Upload | Leoloon`;
  const seoDescription = `100% Free ${title.toLowerCase()} tool. ${description} Zero server uploads, private client-side processing.`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `Free ${title} - Leoloon`,
    "url": currentUrl,
    "description": seoDescription,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={currentUrl} />

        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />

        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              100% Free
            </span>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 border border-sky-500/20 text-sky-600 dark:text-sky-400">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        <div className="w-full">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ToolLayout;