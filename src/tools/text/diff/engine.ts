// src/tools/text/diff/engine.ts

export type DiffType = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
  type: DiffType;
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
  similarity: number; // 0% - 100%
}

// Normalize line strings based on user options
const normalize = (line: string, options: DiffOptions): string => {
  let result = line;
  if (options.ignoreWhitespace) {
    result = result.trim().replace(/\s+/g, ' ');
  }
  if (options.ignoreCase) {
    result = result.toLowerCase();
  }
  return result;
};

// 100% Client-side Longest Common Subsequence (LCS) Diff Algorithm
export const computeDiff = (
  textA: string,
  textB: string,
  options: DiffOptions = {}
): { lines: DiffLine[]; stats: DiffStats } => {
  const rawLinesA = textA.split(/\r?\n/);
  const rawLinesB = textB.split(/\r?\n/);

  // If both empty
  if (!textA && !textB) {
    return {
      lines: [],
      stats: { additions: 0, deletions: 0, unchanged: 0, similarity: 100 },
    };
  }

  const normA = rawLinesA.map((l) => normalize(l, options));
  const normB = rawLinesB.map((l) => normalize(l, options));

  const n = normA.length;
  const m = normB.length;

  // Build LCS matrix
  const matrix: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (normA[i - 1] === normB[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  // Backtrack to reconstruct line differences
  let i = n;
  let j = m;
  const resultReversed: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normA[i - 1] === normB[j - 1]) {
      resultReversed.push({
        type: 'unchanged',
        text: rawLinesA[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      resultReversed.push({
        type: 'added',
        text: rawLinesB[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      resultReversed.push({
        type: 'removed',
        text: rawLinesA[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  const lines = resultReversed.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of lines) {
    if (line.type === 'added') additions++;
    else if (line.type === 'removed') deletions++;
    else unchanged++;
  }

  const total = additions + deletions + unchanged;
  const similarity = total > 0 ? Math.round((unchanged / (total - Math.min(additions, deletions) / 2)) * 100) : 100;

  return {
    lines,
    stats: {
      additions,
      deletions,
      unchanged,
      similarity: Math.min(100, Math.max(0, similarity)),
    },
  };
};