import { PDFDocument, PageSizes } from 'pdf-lib';

export type PageOrientation = 'portrait' | 'landscape' | 'fit';

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export interface ImageToPdfResult {
  blob: Blob;
  downloadUrl: string;
  pageCount: number;
  totalSize: number;
}

// Convert any image (including WebP) to clean JPEG bytes via HTML5 Canvas
const fileToJpegBytes = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      // White background for transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Image conversion failed'));
            return;
          }
          const buffer = await blob.arrayBuffer();
          resolve(new Uint8Array(buffer));
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

export const convertImagesToPdf = async (
  images: ImageItem[],
  orientation: PageOrientation = 'portrait',
  onProgress?: (percent: number) => void
): Promise<ImageToPdfResult> => {
  if (images.length === 0) {
    throw new Error('Please add at least one image.');
  }

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const jpegBytes = await fileToJpegBytes(item.file);
    const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

    let pageWidth: number;
    let pageHeight: number;

    if (orientation === 'portrait') {
      [pageWidth, pageHeight] = PageSizes.A4;
    } else if (orientation === 'landscape') {
      [pageHeight, pageWidth] = PageSizes.A4;
    } else {
      // 'fit' mode - page size matches original image dimensions
      pageWidth = embeddedImage.width;
      pageHeight = embeddedImage.height;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate aspect ratio preserving fit
    const imgDims = embeddedImage.scaleToFit(pageWidth - 40, pageHeight - 40);

    // Center image on page
    page.drawImage(embeddedImage, {
      x: (pageWidth - imgDims.width) / 2,
      y: (pageHeight - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / images.length) * 100));
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    pageCount: images.length,
    totalSize: blob.size,
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};