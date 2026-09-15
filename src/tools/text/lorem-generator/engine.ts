export type GeneratorUnit = 'paragraphs' | 'sentences' | 'words' | 'lists';
export type TextFlavor = 'classic' | 'tech';

export interface GeneratorOptions {
  unit: GeneratorUnit;
  count: number;
  flavor: TextFlavor;
  startWithLorem: boolean;
  wrapHtml: boolean;
}

const LATIN_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'placerat', 'vestibulum',
  'iaculis', 'orci', 'molestie', 'tempus', 'eleifend', 'auctor', 'pharetra',
  'sollicitudin', 'convallis', 'efficitur', 'sagittis', 'facilisis', 'ultricies'
];

const TECH_WORDS = [
  'kubernetes', 'docker', 'microservice', 'react', 'tailwind', 'typescript',
  'serverless', 'graphql', 'rest', 'api', 'pipeline', 'container', 'cluster',
  'database', 'postgres', 'redis', 'cache', 'distributed', 'consensus',
  'latency', 'throughput', 'bandwidth', 'encryption', 'token', 'auth',
  'oauth', 'jwt', 'payload', 'schema', 'query', 'mutation', 'async',
  'await', 'promise', 'callback', 'runtime', 'engine', 'compiler', 'bundle',
  'vite', 'webpack', 'state', 'reducer', 'hook', 'component', 'props',
  'lifecycle', 'middleware', 'endpoint', 'router', 'gateway', 'loadbalancer'
];

const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};

// Generate a natural-feeling sentence
const generateSentence = (words: string[], forceLorem = false): string => {
  if (forceLorem) {
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  }

  const length = Math.floor(Math.random() * 8) + 8; // 8 to 15 words
  const sentenceWords: string[] = [];

  for (let i = 0; i < length; i++) {
    sentenceWords.push(getRandomWord(words));
  }

  // Capitalize first letter
  sentenceWords[0] = sentenceWords[0].charAt(0).toUpperCase() + sentenceWords[0].slice(1);

  // Random comma insertion in longer sentences
  if (length > 10 && Math.random() > 0.4) {
    const commaIndex = Math.floor(length / 2);
    sentenceWords[commaIndex] = `${sentenceWords[commaIndex]},`;
  }

  return `${sentenceWords.join(' ')}.`;
};

// Generate a natural paragraph of 4-6 sentences
const generateParagraph = (words: string[], isFirst = false, startWithLorem = false): string => {
  const sentenceCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 sentences
  const sentences: string[] = [];

  for (let i = 0; i < sentenceCount; i++) {
    const isFirstSentence = isFirst && i === 0 && startWithLorem;
    sentences.push(generateSentence(words, isFirstSentence));
  }

  return sentences.join(' ');
};

// 100% Client-Side Dummy Content Generator
export const generateLoremText = (options: GeneratorOptions): string => {
  const dictionary = options.flavor === 'tech' ? TECH_WORDS : LATIN_WORDS;
  const count = Math.max(1, options.count);

  switch (options.unit) {
    case 'words': {
      const words: string[] = [];
      if (options.startWithLorem) {
        words.push('lorem', 'ipsum', 'dolor', 'sit', 'amet');
      }

      while (words.length < count) {
        words.push(getRandomWord(dictionary));
      }

      const truncated = words.slice(0, count);
      truncated[0] = truncated[0].charAt(0).toUpperCase() + truncated[0].slice(1);
      return truncated.join(' ') + '.';
    }

    case 'sentences': {
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence(dictionary, i === 0 && options.startWithLorem));
      }

      if (options.wrapHtml) {
        return sentences.map((s) => `<p>${s}</p>`).join('\n');
      }
      return sentences.join(' ');
    }

    case 'lists': {
      const items: string[] = [];
      for (let i = 0; i < count; i++) {
        const itemWords: string[] = [];
        const itemLen = Math.floor(Math.random() * 5) + 4;
        for (let j = 0; j < itemLen; j++) {
          itemWords.push(getRandomWord(dictionary));
        }
        itemWords[0] = itemWords[0].charAt(0).toUpperCase() + itemWords[0].slice(1);
        items.push(itemWords.join(' '));
      }

      if (options.wrapHtml) {
        return `<ul>\n${items.map((it) => `  <li>${it}</li>`).join('\n')}\n</ul>`;
      }
      return items.map((it) => `• ${it}`).join('\n');
    }

    case 'paragraphs':
    default: {
      const paragraphs: string[] = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph(dictionary, i === 0, options.startWithLorem));
      }

      if (options.wrapHtml) {
        return paragraphs.map((p) => `<p>${p}</p>`).join('\n\n');
      }
      return paragraphs.join('\n\n');
    }
  }
};