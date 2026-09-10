// src/tools/image/palette-extractor/engine.ts

export interface ColorSwatch {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  textColor: string; // '#FFFFFF' or '#0F172A' based on contrast luminance
}

// Convert RGB to HEX
export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
};

// Convert RGB to HSL
export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

// Calculate perceived luminance to guarantee readable text
export const getAccessibleTextColor = (r: number, g: number, b: number): string => {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0F172A' : '#FFFFFF';
};

// Fast K-Means Color Quantization on sampled pixels
export const extractPaletteFromImage = (
  img: HTMLImageElement,
  kCount: number = 6
): ColorSwatch[] => {
  const canvas = document.createElement('canvas');
  // Downsample to 120x120 for lightning fast in-browser clustering
  const sampleSize = 120;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

  // Gather valid non-transparent pixels
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < imgData.length; i += 4) {
    const a = imgData[i + 3];
    if (a >= 128) {
      pixels.push([imgData[i], imgData[i + 1], imgData[i + 2]]);
    }
  }

  if (pixels.length === 0) return [];

  // Initialize centroids with evenly spaced samples
  const centroids: [number, number, number][] = [];
  const step = Math.floor(pixels.length / kCount);
  for (let i = 0; i < kCount; i++) {
    centroids.push([...pixels[i * step]]);
  }

  const iterations = 8;
  const assignments = new Uint8Array(pixels.length);

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Assign each pixel to the nearest centroid
    for (let pIdx = 0; pIdx < pixels.length; pIdx++) {
      const [pr, pg, pb] = pixels[pIdx];
      let minDist = Infinity;
      let nearest = 0;

      for (let cIdx = 0; cIdx < kCount; cIdx++) {
        const [cr, cg, cb] = centroids[cIdx];
        const dist = (pr - cr) ** 2 + (pg - cg) ** 2 + (pb - cb) ** 2;
        if (dist < minDist) {
          minDist = dist;
          nearest = cIdx;
        }
      }
      assignments[pIdx] = nearest;
    }

    // 2. Recompute centroids
    const sums = Array.from({ length: kCount }, () => [0, 0, 0, 0]); // r, g, b, count
    for (let pIdx = 0; pIdx < pixels.length; pIdx++) {
      const cluster = assignments[pIdx];
      const [pr, pg, pb] = pixels[pIdx];
      sums[cluster][0] += pr;
      sums[cluster][1] += pg;
      sums[cluster][2] += pb;
      sums[cluster][3] += 1;
    }

    for (let cIdx = 0; cIdx < kCount; cIdx++) {
      const count = sums[cIdx][3];
      if (count > 0) {
        centroids[cIdx][0] = Math.round(sums[cIdx][0] / count);
        centroids[cIdx][1] = Math.round(sums[cIdx][1] / count);
        centroids[cIdx][2] = Math.round(sums[cIdx][2] / count);
      }
    }
  }

  // Count cluster frequencies
  const clusterCounts = new Array(kCount).fill(0);
  for (let i = 0; i < assignments.length; i++) {
    clusterCounts[assignments[i]]++;
  }

  // Build swatches and sort by dominance
  const results: ColorSwatch[] = centroids
    .map((c, idx) => {
      const [r, g, b] = c;
      const count = clusterCounts[idx];
      const pct = Math.round((count / pixels.length) * 100);
      return {
        hex: rgbToHex(r, g, b),
        rgb: { r, g, b },
        hsl: rgbToHsl(r, g, b),
        percentage: pct,
        textColor: getAccessibleTextColor(r, g, b),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return results;
};

// Render an aesthetic downloadable PNG palette card
export const generatePaletteCardBlob = (
  swatches: ColorSwatch[],
  filename: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context failed.'));
      return;
    }

    // Dark backdrop
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title & Branding
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('Color Palette Studio', 60, 70);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Extracted from: ${filename.slice(0, 45)}`, 60, 105);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('LEOLOON TOOLS', canvas.width - 200, 70);

    // Swatches Layout
    const startY = 140;
    const blockHeight = 420;
    const paddingX = 60;
    const totalWidth = canvas.width - paddingX * 2;
    const blockWidth = totalWidth / swatches.length;

    swatches.forEach((swatch, idx) => {
      const x = paddingX + idx * blockWidth;

      // Swatch color pillar
      ctx.fillStyle = swatch.hex;
      ctx.beginPath();
      // Round top corners
      if (idx === 0) {
        ctx.roundRect(x, startY, blockWidth, blockHeight, [16, 0, 0, 16]);
      } else if (idx === swatches.length - 1) {
        ctx.roundRect(x, startY, blockWidth, blockHeight, [0, 16, 16, 0]);
      } else {
        ctx.rect(x, startY, blockWidth, blockHeight);
      }
      ctx.fill();

      // Swatch Information labels at bottom of pillar
      ctx.fillStyle = swatch.textColor;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(swatch.hex, x + 20, startY + blockHeight - 60);

      ctx.font = '14px sans-serif';
      ctx.fillText(`${swatch.percentage}% Dominance`, x + 20, startY + blockHeight - 30);
    });

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Card generation failed.'));
    }, 'image/png');
  });
};