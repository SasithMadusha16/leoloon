export interface JsonStats {
  sizeBytes: number;
  keysCount: number;
  depth: number;
  lines: number;
}

export interface ParseResult {
  isValid: boolean;
  parsedData: any | null;
  error: {
    message: string;
    line?: number;
    column?: number;
  } | null;
  stats: JsonStats;
}

// Compute object depth and total key count
const analyzeJson = (data: any, currentDepth = 1): { maxDepth: number; keysCount: number } => {
  if (data === null || typeof data !== 'object') {
    return { maxDepth: currentDepth, keysCount: 0 };
  }

  let maxDepth = currentDepth;
  let keysCount = 0;

  for (const key of Object.keys(data)) {
    keysCount++;
    if (typeof data[key] === 'object' && data[key] !== null) {
      const sub = analyzeJson(data[key], currentDepth + 1);
      if (sub.maxDepth > maxDepth) maxDepth = sub.maxDepth;
      keysCount += sub.keysCount;
    }
  }

  return { maxDepth, keysCount };
};

// Calculate exact line and column from character index
const getLineAndColumn = (text: string, position: number): { line: number; column: number } => {
  const lines = text.slice(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
};

// Parse and validate with exact error tracking
export const validateAndParseJson = (raw: string): ParseResult => {
  const clean = raw.trim();
  if (!clean) {
    return {
      isValid: false,
      parsedData: null,
      error: { message: 'Input is empty' },
      stats: { sizeBytes: 0, keysCount: 0, depth: 0, lines: 0 },
    };
  }

  try {
    const parsed = JSON.parse(clean);
    const { maxDepth, keysCount } = analyzeJson(parsed);
    const lines = clean.split('\n').length;

    return {
      isValid: true,
      parsedData: parsed,
      error: null,
      stats: {
        sizeBytes: new Blob([clean]).size,
        keysCount,
        depth: maxDepth,
        lines,
      },
    };
  } catch (err) {
    let message = err instanceof Error ? err.message : 'Invalid JSON Syntax';
    let line: number | undefined;
    let column: number | undefined;

    // Extract position error (e.g. "at position 42" or "line 3 column 5")
    const posMatch = message.match(/at position (\d+)/);
    const lineColMatch = message.match(/line (\d+) column (\d+)/);

    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    } else if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const loc = getLineAndColumn(clean, pos);
      line = loc.line;
      column = loc.column;
    }

    return {
      isValid: false,
      parsedData: null,
      error: { message, line, column },
      stats: { sizeBytes: new Blob([clean]).size, keysCount: 0, depth: 0, lines: clean.split('\n').length },
    };
  }
};

// Format JSON with selectable indent
export const formatJson = (data: any, indent: 2 | 4 | '\t' = 2): string => {
  return JSON.stringify(data, null, indent);
};

// Minify JSON to a single string line
export const minifyJson = (data: any): string => {
  return JSON.stringify(data);
};

// Sort object keys alphabetically recursively
export const sortJsonKeys = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sortJsonKeys);
  } else if (data !== null && typeof data === 'object') {
    return Object.keys(data)
      .sort()
      .reduce((acc: any, key: string) => {
        acc[key] = sortJsonKeys(data[key]);
        return acc;
      }, {});
  }
  return data;
};

// Smart Auto-Fix: Fix unquoted keys, single quotes, trailing commas
export const autoRepairJson = (raw: string): string => {
  let text = raw.trim();

  // Replace single quotes with double quotes where applicable
  text = text.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // Fix unquoted keys: { name: "value" } -> { "name": "value" }
  text = text.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  // Remove trailing commas: [1, 2, ] -> [1, 2] and {"a": 1, } -> {"a": 1}
  text = text.replace(/,\s*([\]}])/g, '$1');

  return text;
};

// Convert JSON to TypeScript interface
export const jsonToTypeScript = (data: any, rootName = 'RootObject'): string => {
  const generateInterface = (obj: any, name: string): string => {
    if (obj === null || typeof obj !== 'object') {
      return `type ${name} = ${typeof obj};`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return `type ${name} = any[];`;
      const itemType = typeof obj[0] === 'object' ? `${name}Item` : typeof obj[0];
      const subInterface = typeof obj[0] === 'object' ? generateInterface(obj[0], `${name}Item`) : '';
      return `${subInterface}\ntype ${name} = ${itemType}[];`;
    }

    let subInterfaces = '';
    const fields: string[] = [];

    for (const [key, val] of Object.entries(obj)) {
      let fieldType = 'any';
      if (val === null) {
        fieldType = 'null';
      } else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          const subName = `${capitalize(key)}Item`;
          subInterfaces += `\n${generateInterface(val[0], subName)}\n`;
          fieldType = `${subName}[]`;
        } else if (val.length > 0) {
          fieldType = `${typeof val[0]}[]`;
        } else {
          fieldType = 'any[]';
        }
      } else if (typeof val === 'object') {
        const subName = capitalize(key);
        subInterfaces += `\n${generateInterface(val, subName)}\n`;
        fieldType = subName;
      } else {
        fieldType = typeof val;
      }

      fields.push(`  ${key}: ${fieldType};`);
    }

    return `${subInterfaces}export interface ${name} {\n${fields.join('\n')}\n}`;
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return generateInterface(data, rootName).trim();
};

// Convert JSON Array to CSV format
export const jsonToCsv = (data: any): string => {
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0 || typeof items[0] !== 'object' || items[0] === null) {
    return '';
  }

  const headers = Array.from(
    new Set(items.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : [])))
  );

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    headers.join(','),
    ...items.map((row) =>
      headers.map((field) => escapeCell(row ? row[field] : '')).join(',')
    ),
  ];

  return csvRows.join('\n');
};