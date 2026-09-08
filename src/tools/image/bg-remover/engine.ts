// src/tools/image/bg-remover/engine.ts
import { removeBackground } from '@imgly/background-removal';

export interface ProgressState {
  stage: string;
  percent: number;
}

export const runAiBackgroundRemoval = async (
  imageSource: File | Blob | string,
  onProgress?: (progress: ProgressState) => void
): Promise<Blob> => {
  return await removeBackground(imageSource, {
    progress: (key: string, current: number, total: number) => {
      let stage = 'Analyzing image...';
      if (key.includes('fetch')) {
        stage = 'Downloading neural model...';
      } else if (key.includes('compute')) {
        stage = 'Detecting subject & edges...';
      }

      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      if (onProgress) {
        onProgress({ stage, percent });
      }
    },
  });
};

export const applyBackdropColor = (
  transparentBlob: Blob,
  bgColor: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(transparentBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Canvas context failed.'));
        return;
      }

      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export failed.'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load cutout image.'));
    };
  });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};