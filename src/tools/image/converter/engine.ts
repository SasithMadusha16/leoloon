export type SupportedFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ConversionResult {
  blob: Blob;
  previewUrl: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  format: SupportedFormat;
  extension: string;
}

export const convertImageFormat = (
  file: File,
  targetFormat: SupportedFormat,
  quality: number = 0.92
): Promise<ConversionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image format conversion failed'));
              return;
            }

            const extensionMap: Record<SupportedFormat, string> = {
              'image/jpeg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
            };

            const ext = extensionMap[targetFormat];
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              blob,
              previewUrl,
              originalName: file.name,
              originalSize: file.size,
              newSize: blob.size,
              format: targetFormat,
              extension: ext,
            });
          },
          targetFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image into DOM'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error reading uploaded file'));
    reader.readAsDataURL(file);
  });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};