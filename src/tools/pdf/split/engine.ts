import { PDFDocument } from 'pdf-lib';

export interface PDFSplitResult {
  blob: Blob;
  downloadUrl: string;
  extractedPageCount: number;
  newSize: number;
}

// PDF එකේ සම්පූර්ණ පිටු ගණන ලබාගැනීම
export const getPdfDetails = async (file: File): Promise<{ pageCount: number }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return { pageCount: pdf.getPageCount() };
};

// "1-3, 5, 7" වැනි text string එකක් 0-based page indices array එකක් බවට හැරවීම
export const parsePageRanges = (rangeStr: string, maxPages: number): number[] => {
  const pagesToExtract = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pagesToExtract.add(i - 1); // 0-based index
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        pagesToExtract.add(page - 1); // 0-based index
      }
    }
  }

  return Array.from(pagesToExtract).sort((a, b) => a - b);
};

// තෝරාගත් පිටු පමණක් Extract කර අලුත් PDF එකක් සෑදීම
export const extractPdfPages = async (
  file: File,
  pageIndices: number[]
): Promise<PDFSplitResult> => {
  if (pageIndices.length === 0) {
    throw new Error('Please select at least one valid page to extract.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    extractedPageCount: copiedPages.length,
    newSize: blob.size,
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};