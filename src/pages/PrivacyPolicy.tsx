import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <Helmet>
        <title>Privacy Policy - Leoloon</title>
        <meta name="description" content="Privacy Policy for Leoloon client-side utilities. Learn how your data is kept 100% secure and private in your browser." />
      </Helmet>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: September 15, 2026</p>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed">
        <section className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-2">1. Client-Side Execution Guarantee</h2>
          <p>
            At <strong>Leoloon</strong>, user privacy is our core foundation. All calculations, image manipulations, document processing, and formatting utilities run <strong>100% locally inside your web browser</strong> using JavaScript and WebAssembly. Your files, images, and text inputs are never uploaded to, transmitted across, or stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p>
            We do not collect personally identifiable information (PII) such as your name, email address, phone number, or physical location. We do not require registration or user accounts to access any of our utilities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Analytics & Usage Data</h2>
          <p>
            We use privacy-friendly analytics (such as Vercel Web Analytics) to understand aggregate traffic metrics (e.g., page views, country-level counts, and referring sites). These analytics tools are cookieless, do not track you across other websites, and comply with GDPR/CCPA regulations without recording personal identities or IP addresses.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Third-Party Advertising & Cookies</h2>
          <p>
            To keep Leoloon free, we may display third-party advertisements (such as Google AdSense). Third-party vendors, including Google, use cookies to serve ads based on prior visits to our website or other websites on the internet. 
          </p>
          <p className="mt-2">
            You may opt out of personalized advertising by visiting Google's <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer" className="text-amber-600 dark:text-amber-400 underline">Ads Settings</a> or by configuring cookie preferences in your browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. External Links</h2>
          <p>
            Our website may contain links to external sites that are not operated by us. We strongly advise you to review the Privacy Policy of every external website you visit, as we have no control over their content and practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy or any of our tools, please reach out via our GitHub repository or contact us at <a href="mailto:support@leoloon.com" className="text-amber-600 dark:text-amber-400 underline">support@leoloon.com</a>.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/" className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
};