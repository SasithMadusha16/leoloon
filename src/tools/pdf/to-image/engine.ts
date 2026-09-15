import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Vite-safe Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export type ImageFormat = 'jpeg' | 'png';

export interface ExtractedImagePage {
  pageNumber: number;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
  extension: 'jpg' | 'png';
}

export interface ConversionOptions {
  format: ImageFormat;
  scale: number; // 1.5x (Standard) or 2.0x (High-Res)
  quality: number; // For JPG (0.8 - 0.95)
}

// Convert all PDF pages to Images
export const convertPdfToImages = async (
  file: File,
  options: ConversionOptions,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedImagePage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const extractedPages: ExtractedImagePage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: options.scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context could not be created.');

    if (options.format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Type casting so TypeScript doesn't throw TS2345
    await (page.render({
      canvasContext: ctx as any,
      viewport: viewport,
    } as any) as any).promise;

    const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = options.format === 'jpeg' ? 'jpg' : 'png';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${pageNum} to image.`));
        },
        mimeType,
        options.quality
      );
    });

    extractedPages.push({
      pageNumber: pageNum,
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      size: blob.size,
      extension,
    });

    if (onProgress) {
      onProgress(pageNum, totalPages);
    }
  }

  return extractedPages;
};

// පිටු සියල්ල එකවර ZIP file එකක් ලෙස බාගත කිරීම
export const createZipArchive = async (
  images: ExtractedImagePage[],
  baseName: string
): Promise<Blob> => {
  const zip = new JSZip();
  const cleanName = baseName.replace(/\.[^/.]+$/, '');

  images.forEach((img) => {
    zip.file(`${cleanName}-page-${img.pageNumber}.${img.extension}`, img.blob);
  });

  return await zip.generateAsync({ type: 'blob' });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};