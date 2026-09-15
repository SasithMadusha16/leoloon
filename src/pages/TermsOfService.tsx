import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <Helmet>
        <title>Terms of Service - Leoloon</title>
        <meta name="description" content="Terms of Service and conditions for using Leoloon web utilities." />
      </Helmet>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: September 15, 2026</p>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Agreement to Terms</h2>
          <p>
            By accessing or using Leoloon (<strong>leoloon.com</strong>), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may discontinue use of the website immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Permitted Use</h2>
          <p>
            All tools and utilities on Leoloon are provided free of charge for personal, commercial, and educational purposes. You agree not to misuse our platform by attempting to disrupt service availability, reverse engineer proprietary code, or inject malicious scripts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Disclaimer of Warranties</h2>
          <p>
            Leoloon and all associated utilities are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. While we strive for absolute accuracy in our converters, formatters, and generators, we make no guarantees regarding data integrity or mathematical precision for critical legal or financial operations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Limitation of Liability</h2>
          <p>
            In no event shall Leoloon or its developers be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services, including data corruption or browser crashes caused by memory-heavy client-side tasks.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Changes to Terms</h2>
          <p>
            We reserve the right to revise or modify these Terms at any time without prior notice. By continuing to use the service after changes are posted, you accept the updated terms.
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