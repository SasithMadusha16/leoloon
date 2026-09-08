// src/tools/pdf/watermark/engine.ts
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Vite worker setup for live page rendering
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number; // 0.1 to 1.0
  colorHex: string;
  position: 'diagonal' | 'center' | 'bottom-right';
}

export interface WatermarkResult {
  blob: Blob;
  downloadUrl: string;
  size: number;
}

// Convert Hex string to pdf-lib RGB values (0 to 1)
const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
};

// Render real crisp preview of the 1st page for the live canvas preview
export const renderFirstPagePreview = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.75 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be created.');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render({
    canvasContext: ctx as any,
    viewport: viewport,
  } as any) as any).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
};

// Apply watermark text to all PDF pages permanently
export const applyWatermark = async (
  file: File,
  options: WatermarkOptions
): Promise<WatermarkResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const color = hexToRgb(options.colorHex);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = 0;
    let y = 0;
    let rotationAngle = 0;

    if (options.position === 'diagonal') {
      rotationAngle = 45;
      const rad = (45 * Math.PI) / 180;
      x = width / 2 - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
      y = height / 2 - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);
    } else if (options.position === 'center') {
      x = (width - textWidth) / 2;
      y = (height - textHeight) / 2;
      rotationAngle = 0;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 40;
      rotationAngle = 0;
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color,
      opacity: options.opacity,
      rotate: degrees(rotationAngle),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    size: blob.size,
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};