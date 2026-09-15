export interface DocumentStats {
  words: number;
  chars: number;
  lines: number;
  readingTimeSecs: number;
}

export const computeDocStats = (markdown: string): DocumentStats => {
  const chars = markdown.length;
  const lines = markdown.split(/\r?\n/).length;
  const cleanWords = markdown.trim().replace(/[#*_~`>[\]()|-]/g, '').trim().split(/\s+/).filter(Boolean);
  const words = markdown.trim() ? cleanWords.length : 0;
  const readingTimeSecs = words > 0 ? Math.ceil(words / 3.33) : 0; // ~200 WPM

  return { words, chars, lines, readingTimeSecs };
};

// HTML entity escaping for security
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// 100% Client-Side Robust GFM Markdown-to-HTML Compiler
export const parseMarkdown = (markdown: string): string => {
  if (!markdown.trim()) return '';

  const lines = markdown.split(/\r?\n/);
  let html = '';
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockBuffer: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let inTable = false;
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length < 2) {
      tableBuffer = [];
      inTable = false;
      return;
    }

    const [headerRow, , ...bodyRows] = tableBuffer;
    const parseCells = (row: string) =>
      row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

    const headers = parseCells(headerRow);
    let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">';
    tableHtml += '<thead class="bg-slate-100 dark:bg-slate-800"><tr>';
    for (const h of headers) {
      tableHtml += `<th class="border border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-bold text-slate-800 dark:text-slate-100">${parseInline(h)}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';

    for (const row of bodyRows) {
      const cells = parseCells(row);
      tableHtml += '<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">';
      for (const c of cells) {
        tableHtml += `<td class="border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-300">${parseInline(c)}</td>`;
      }
      tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table></div>';
    html += tableHtml;
    tableBuffer = [];
    inTable = false;
  };

  const parseInline = (text: string): string => {
    return text
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-mono text-[11px]">$1</code>')
      // Bold + Italic
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~([^~]+)~~/g, '<del class="text-slate-400">$1</del>')
      // Images: ![alt](url)
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2 border border-slate-200 dark:border-slate-800" />')
      // Links: [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-sky-400 hover:underline font-medium">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Fenced Code Blocks (```)
    if (rawLine.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = rawLine.trim().slice(3).trim();
        codeBlockBuffer = [];
      } else {
        inCodeBlock = false;
        const codeContent = escapeHtml(codeBlockBuffer.join('\n'));
        html += `<div class="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
          ${codeBlockLang ? `<div class="px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase font-bold">${codeBlockLang}</div>` : ''}
          <pre class="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed"><code>${codeContent}</code></pre>
        </div>`;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine);
      continue;
    }

    // Tables
    if (rawLine.trim().startsWith('|') && rawLine.trim().endsWith('|')) {
      inTable = true;
      tableBuffer.push(rawLine.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }

    // List Handling
    const ulMatch = rawLine.match(/^(\s*)[-*+]\s+(.*)/);
    const olMatch = rawLine.match(/^(\s*)\d+\.\s+(.*)/);

    if (ulMatch || olMatch) {
      const isTask = ulMatch && (ulMatch[2].startsWith('[ ] ') || ulMatch[2].startsWith('[x] '));

      if (!inList) {
        inList = true;
        listType = olMatch ? 'ol' : 'ul';
        html += listType === 'ol' ? '<ol class="list-decimal list-inside my-3 space-y-1 text-slate-700 dark:text-slate-300">' : '<ul class="list-disc list-inside my-3 space-y-1 text-slate-700 dark:text-slate-300">';
      }

      if (isTask && ulMatch) {
        const checked = ulMatch[2].startsWith('[x] ');
        const itemText = ulMatch[2].slice(4);
        html += `<li class="list-none flex items-center gap-2">
          <input type="checkbox" ${checked ? 'checked' : ''} disabled class="accent-sky-500 rounded" />
          <span class="${checked ? 'line-through text-slate-400' : ''}">${parseInline(itemText)}</span>
        </li>`;
      } else {
        const content = ulMatch ? ulMatch[2] : olMatch![2];
        html += `<li>${parseInline(content)}</li>`;
      }
      continue;
    } else if (inList) {
      html += listType === 'ol' ? '</ol>' : '</ul>';
      inList = false;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(rawLine.trim())) {
      html += '<hr class="my-6 border-slate-200 dark:border-slate-800" />';
      continue;
    }

    // Headings
    if (rawLine.startsWith('#')) {
      const match = rawLine.match(/^(#{1,6})\s+(.*)/);
      if (match) {
        const level = match[1].length;
        const text = parseInline(match[2]);
        const classes: Record<number, string> = {
          1: 'text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800',
          2: 'text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800/60',
          3: 'text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2',
          4: 'text-base font-semibold text-slate-800 dark:text-slate-100 mt-3 mb-1',
          5: 'text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2 mb-1',
          6: 'text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-2 mb-1',
        };
        html += `<h${level} class="${classes[level]}">${text}</h${level}>`;
        continue;
      }
    }

    // Blockquote
    if (rawLine.startsWith('>')) {
      const quoteText = parseInline(rawLine.replace(/^>\s?/, ''));
      html += `<blockquote class="border-l-4 border-sky-500 pl-4 py-1.5 my-3 bg-sky-50/40 dark:bg-sky-950/20 text-slate-700 dark:text-slate-300 italic rounded-r-lg">${quoteText}</blockquote>`;
      continue;
    }

    // Paragraphs or Empty Lines
    if (rawLine.trim() === '') {
      continue;
    } else {
      html += `<p class="my-2 leading-relaxed text-slate-700 dark:text-slate-300">${parseInline(rawLine)}</p>`;
    }
  }

  if (inTable) flushTable();
  if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';

  return html;
};

// Generate a standalone, styled HTML document for downloading
export const exportFullHtmlDocument = (_markdown: string, renderedHtml: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Markdown Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; background: #fff; }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.5em; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #0284c7; }
    pre code { background: none; color: inherit; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
    blockquote { border-left: 4px solid #0284c7; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; background: #f0f9ff; padding: 8px 16px; border-radius: 0 8px 8px 0; }
    a { color: #0284c7; }
    hr { border: 0; height: 1px; background: #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  ${renderedHtml}
</body>
</html>`;
};