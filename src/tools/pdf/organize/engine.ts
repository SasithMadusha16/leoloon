import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Vite worker setup for canvas thumbnail rendering
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface OrganizePageItem {
  id: string;
  originalIndex: number; // 0-based index in the source PDF
  thumbnailUrl: string;
}

export interface OrganizeResult {
  blob: Blob;
  downloadUrl: string;
  pageCount: number;
  size: number;
}

// Generate thumbnail previews for all PDF pages
export const loadPdfPagesForOrganize = async (
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<OrganizePageItem[]> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: OrganizePageItem[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
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

      pages.push({
        id: Math.random().toString(36).substring(2, 9),
        originalIndex: i - 1,
        thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
      });
    }

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return pages;
};

// Reorder, delete, and save the organized PDF
export const saveOrganizedPdf = async (
  file: File,
  remainingPages: OrganizePageItem[]
): Promise<OrganizeResult> => {
  if (remainingPages.length === 0) {
    throw new Error('You must keep at least one page in the document.');
  }

  const srcBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(srcBuffer);
  const newDoc = await PDFDocument.create();

  const indicesToCopy = remainingPages.map((p) => p.originalIndex);
  const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);

  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    pageCount: remainingPages.length,
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