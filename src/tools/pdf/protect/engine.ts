// src/tools/pdf/protect/engine.ts
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Vite worker setup for rendering page canvases
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ProtectOptions {
  userPassword: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
}

export interface ProtectResult {
  blob: Blob;
  downloadUrl: string;
  size: number;
}

// Render first page preview thumbnail
export const renderFirstPage = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.5 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed.');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render({
    canvasContext: ctx as any,
    viewport: viewport,
  } as any) as any).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
};

// Encrypt PDF with password and permissions
export const encryptPdfDocument = async (
  file: File,
  options: ProtectOptions,
  onProgress?: (current: number, total: number) => void
): Promise<ProtectResult> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  // Configure permissions array
  const userPermissions: ('print' | 'modify' | 'copy' | 'annot-forms')[] = [];
  if (options.allowPrinting) userPermissions.push('print');
  if (options.allowCopying) userPermissions.push('copy');
  if (options.allowModifying) {
    userPermissions.push('modify');
    userPermissions.push('annot-forms');
  }

  let doc: jsPDF | null = null;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    // 1.8x scale delivers sharp, high-resolution rendering
    const viewport = page.getViewport({ scale: 1.8 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render({
      canvasContext: ctx as any,
      viewport: viewport,
    } as any) as any).promise;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const isLandscape = viewport.width > viewport.height;

    // Initialize document on first page
    if (i === 1) {
      doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [viewport.width, viewport.height],
        encryption: {
          userPassword: options.userPassword,
          ownerPassword: options.userPassword + '_admin',
          userPermissions: userPermissions,
        },
      });
      doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
    } else if (doc) {
      doc.addPage([viewport.width, viewport.height], isLandscape ? 'landscape' : 'portrait');
      doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
    }

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  if (!doc) throw new Error('Failed to generate protected PDF.');

  const blob = doc.output('blob');
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