import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface GifOptions {
  startTime: number;
  endTime: number;
  fps: number;
  targetWidth: number;
  colors: number; // e.g. 128 or 256
}

export interface GifProgress {
  stage: string;
  percent: number;
  currentFrame: number;
  totalFrames: number;
}

export interface GifResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  framesCount: number;
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

// Extract frames from video and compile into animated GIF
export const convertVideoToGif = async (
  file: File,
  options: GifOptions,
  onProgress?: (progress: GifProgress) => void
): Promise<GifResult> => {
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;

  return new Promise((resolve, reject) => {
    video.onloadedmetadata = async () => {
      try {
        const duration = options.endTime - options.startTime;
        if (duration <= 0) {
          throw new Error('End time must be greater than start time.');
        }

        const aspect = video.videoHeight / video.videoWidth;
        const width = options.targetWidth - (options.targetWidth % 2);
        const height = Math.round(width * aspect) - (Math.round(width * aspect) % 2);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) throw new Error('Canvas context could not be created.');

        const interval = 1 / options.fps;
        const totalFrames = Math.max(1, Math.floor(duration * options.fps));
        const delay = Math.round(1000 / options.fps);

        const gif = GIFEncoder();

        let frameIndex = 0;
        let currentTime = options.startTime;

        while (currentTime < options.endTime && frameIndex < totalFrames) {
          // Seek video to exact frame timestamp
          await new Promise<void>((res) => {
            video.currentTime = currentTime;
            video.onseeked = () => res();
          });

          // Draw current frame to canvas
          ctx.drawImage(video, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);

          // Color quantization & palette matching
          const palette = quantize(imgData.data, options.colors);
          const indexed = applyPalette(imgData.data, palette);

          // Write GIF frame
          gif.writeFrame(indexed, width, height, {
            palette,
            delay,
            repeat: 0, // Infinite loop
          });

          frameIndex++;
          currentTime += interval;

          if (onProgress) {
            const percent = Math.min(100, Math.round((frameIndex / totalFrames) * 100));
            onProgress({
              stage: `Encoding frame ${frameIndex} of ${totalFrames}...`,
              percent,
              currentFrame: frameIndex,
              totalFrames,
            });
          }
        }

        gif.finish();
        URL.revokeObjectURL(objectUrl);

        const bytes = gif.bytesView();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'image/gif' });

        resolve({
          blob,
          url: URL.createObjectURL(blob),
          size: blob.size,
          width,
          height,
          framesCount: frameIndex,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video file.'));
    };
  });
};