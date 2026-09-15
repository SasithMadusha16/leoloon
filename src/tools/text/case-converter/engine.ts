// src/tools/text/case-converter/engine.ts

export type CaseFormat =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase'
  | 'alternating'
  | 'inverse';

// Split string into constituent words handling spaces, hyphens, underscores, and camelCase
export const extractWords = (input: string): string[] => {
  if (!input.trim()) return [];
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .trim()
    .split(/\s+/);
};

export const convertCase = (text: string, format: CaseFormat): string => {
  if (!text) return '';

  switch (format) {
    case 'uppercase':
      return text.toUpperCase();

    case 'lowercase':
      return text.toLowerCase();

    case 'titlecase':
      return text.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

    case 'sentencecase':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());

    case 'camelcase': {
      const words = extractWords(text);
      if (words.length === 0) return '';
      return (
        words[0].toLowerCase() +
        words
          .slice(1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('')
      );
    }

    case 'pascalcase': {
      const words = extractWords(text);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }

    case 'snakecase': {
      const words = extractWords(text);
      return words.map((w) => w.toLowerCase()).join('_');
    }

    case 'kebabcase': {
      const words = extractWords(text);
      return words.map((w) => w.toLowerCase()).join('-');
    }

    case 'constantcase': {
      const words = extractWords(text);
      return words.map((w) => w.toUpperCase()).join('_');
    }

    case 'dotcase': {
      const words = extractWords(text);
      return words.map((w) => w.toLowerCase()).join('.');
    }

    case 'alternating':
      return text
        .split('')
        .map((char, i) => (i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
        .join('');

    case 'inverse':
      return text
        .split('')
        .map((char) =>
          char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        )
        .join('');

    default:
      return text;
  }
};