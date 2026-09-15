import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Vite Worker configuration for in-browser rendering
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface RotateResult {
  blob: Blob;
  downloadUrl: string;
  size: number;
}

// Render real visual thumbnails of each PDF page
export const renderPageThumbnails = async (
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const thumbnails: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    // Scale 0.35 is lightweight and ultra-fast for crisp thumbnails
    const viewport = page.getViewport({ scale: 0.35 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await (page.render({
        canvasContext: ctx as any,
        viewport: viewport,
      } as any) as any).promise;

      thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return thumbnails;
};

// Rotate PDF pages permanently
export const rotatePdf = async (
  file: File,
  pageRotations: number[]
): Promise<RotateResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const additionalAngle = pageRotations[index] || 0;
    if (additionalAngle !== 0) {
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + additionalAngle) % 360));
    }
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