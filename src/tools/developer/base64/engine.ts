// src/tools/developer/base64/engine.ts

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 100% Unicode & UTF-8 Safe Base64 Encoding
export const encodeUtf8Base64 = (str: string, urlSafe = false): string => {
  if (!str) return '';
  const bytes = new TextEncoder().encode(str);
  let binString = '';
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binString);

  if (urlSafe) {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  return base64;
};

// 100% Unicode & UTF-8 Safe Base64 Decoding
export const decodeUtf8Base64 = (base64Str: string): { text: string; error?: string } => {
  if (!base64Str.trim()) return { text: '' };

  try {
    let clean = base64Str.trim().replace(/\s/g, '');

    // Convert URL-safe characters back to standard
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');

    // Add back padding if missing
    while (clean.length % 4 !== 0) {
      clean += '=';
    }

    const binString = atob(clean);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }

    const text = new TextDecoder().decode(bytes);
    return { text };
  } catch (err) {
    return {
      text: '',
      error: err instanceof Error ? err.message : 'Invalid Base64 string syntax',
    };
  }
};

// Convert File to Base64 Data URI & Raw Base64
export const fileToBase64 = (
  file: File
): Promise<{ dataUri: string; rawBase64: string; mimeType: string; size: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      const rawBase64 = dataUri.split(',')[1] || '';
      resolve({
        dataUri,
        rawBase64,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert Base64 / Data URI back to Blob for download or preview
export const base64ToBlob = (
  base64OrDataUri: string,
  fallbackMime = 'application/octet-stream'
): { blob: Blob | null; mimeType: string; error?: string } => {
  try {
    let raw = base64OrDataUri.trim();
    let mime = fallbackMime;

    if (raw.startsWith('data:')) {
      const parts = raw.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mime = match[1];
      raw = parts[1] || '';
    }

    raw = raw.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    while (raw.length % 4 !== 0) raw += '=';

    const binStr = atob(raw);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }

    return {
      blob: new Blob([bytes], { type: mime }),
      mimeType: mime,
    };
  } catch (err) {
    return {
      blob: null,
      mimeType: fallbackMime,
      error: err instanceof Error ? err.message : 'Invalid Base64 sequence',
    };
  }
};