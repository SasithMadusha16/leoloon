export interface CompressionResult {
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressionRatio: number;
}

export const compressImage = (
  file: File,
  quality: number = 0.8, // 0.1 to 1.0
  targetFormat: string = 'image/webp'
): Promise<CompressionResult> => {
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
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Convert canvas to compressed Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const previewUrl = URL.createObjectURL(blob);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savedBytes = originalSize - compressedSize;
            const compressionRatio = Math.round((savedBytes / originalSize) * 100);

            resolve({
              blob,
              previewUrl,
              originalSize,
              compressedSize,
              width: img.width,
              height: img.height,
              compressionRatio: compressionRatio > 0 ? compressionRatio : 0,
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