export interface TextStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeSecs: number;
  speakingTimeSecs: number;
  avgWordLength: number;
}

export interface KeywordFrequency {
  word: string;
  count: number;
  density: number; // percentage
}

export interface SocialLimit {
  label: string;
  max: number;
  current: number;
  percent: number;
  isOver: boolean;
}

const COMMON_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'is', 'are', 'was', 'were', 'been', 'has', 'had', 'its'
]);

export const computeTextStats = (text: string): TextStats => {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;

  const rawWords = text.trim() ? text.trim().split(/\s+/) : [];
  const words = rawWords.length;

  const paragraphs = text.trim()
    ? text.split(/\n+/).filter((p) => p.trim().length > 0).length
    : 0;

  // Match sentences ending in ., !, or ?
  const sentencesMatch = text.trim().match(/[^.!?]+[.!?]+(\s|$)/g);
  const sentences = text.trim() ? (sentencesMatch ? sentencesMatch.length : 1) : 0;

  // Average reading speed: ~200 words/min (3.33 words/sec)
  const readingTimeSecs = words > 0 ? Math.ceil(words / 3.33) : 0;
  // Average speaking speed: ~130 words/min (2.16 words/sec)
  const speakingTimeSecs = words > 0 ? Math.ceil(words / 2.16) : 0;

  const totalWordChars = rawWords.reduce((acc, word) => acc + word.length, 0);
  const avgWordLength = words > 0 ? parseFloat((totalWordChars / words).toFixed(1)) : 0;

  return {
    words,
    chars,
    charsNoSpaces,
    sentences,
    paragraphs,
    readingTimeSecs,
    speakingTimeSecs,
    avgWordLength,
  };
};

export const computeKeywordDensity = (text: string, maxItems = 6): KeywordFrequency[] => {
  if (!text.trim()) return [];

  // Extract clean alphanumeric words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !COMMON_STOP_WORDS.has(w));

  if (words.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = words.length;

  return sorted.slice(0, maxItems).map(([word, count]) => ({
    word,
    count,
    density: parseFloat(((count / total) * 100).toFixed(1)),
  }));
};

export const computeSocialLimits = (chars: number): SocialLimit[] => {
  const limits = [
    { label: 'X (Twitter)', max: 280 },
    { label: 'SEO Title Tag', max: 60 },
    { label: 'SEO Meta Description', max: 160 },
    { label: 'Instagram Bio', max: 150 },
  ];

  return limits.map((lim) => {
    const percent = Math.min(100, Math.round((chars / lim.max) * 100));
    return {
      label: lim.label,
      max: lim.max,
      current: chars,
      percent,
      isOver: chars > lim.max,
    };
  });
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

// Case transformation helpers
export const transformCase = (
  text: string,
  type: 'upper' | 'lower' | 'title' | 'sentence' | 'clean'
): string => {
  switch (type) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case 'clean':
      return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
    default:
      return text;
  }
};