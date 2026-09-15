export type CompressionLevel = 'light' | 'balanced' | 'aggressive';
export type TargetResolution = 'original' | '1080p' | '720p' | '480p' | '360p';

export interface CompressProgress {
  percent: number;
  currentTime: number;
}

export interface CompressResult {
  blob: Blob;
  url: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Calculate scaled dimensions maintaining aspect ratio with even pixel alignment
export const calculateTargetDimensions = (
  origW: number,
  origH: number,
  res: TargetResolution
): { width: number; height: number } => {
  if (res === 'original') {
    return {
      width: origW - (origW % 2),
      height: origH - (origH % 2),
    };
  }

  const isLandscape = origW >= origH;
  let targetLimit = 720;

  if (res === '1080p') targetLimit = 1080;
  if (res === '720p') targetLimit = 720;
  if (res === '480p') targetLimit = 480;
  if (res === '360p') targetLimit = 360;

  let w = origW;
  let h = origH;

  if (isLandscape) {
    if (origH > targetLimit) {
      h = targetLimit;
      w = Math.round((targetLimit * origW) / origH);
    }
  } else {
    if (origW > targetLimit) {
      w = targetLimit;
      h = Math.round((targetLimit * origH) / origW);
    }
  }

  // Codecs require even dimensions
  return {
    width: w - (w % 2),
    height: h - (h % 2),
  };
};

// Return optimal bitrate in bps based on resolution and level
export const getTargetBitrate = (targetHeight: number, level: CompressionLevel): number => {
  let baseBitrate = 1_800_000; // 1.8 Mbps

  if (targetHeight >= 1080) baseBitrate = 3_000_000;
  else if (targetHeight >= 720) baseBitrate = 1_800_000;
  else if (targetHeight >= 480) baseBitrate = 900_000;
  else baseBitrate = 500_000;

  if (level === 'light') return Math.round(baseBitrate * 1.3);
  if (level === 'aggressive') return Math.round(baseBitrate * 0.55);
  return baseBitrate; // balanced
};

// 100% Client-Side Compression using Offscreen Canvas & MediaRecorder
export const compressVideoClientSide = (
  file: File,
  resolution: TargetResolution,
  level: CompressionLevel,
  onProgress?: (progress: CompressProgress) => void
): Promise<CompressResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.crossOrigin = 'anonymous';
    video.volume = 0.001; // Virtually inaudible but audio track preserved

    video.onloadedmetadata = () => {
      const { width, height } = calculateTargetDimensions(
        video.videoWidth,
        video.videoHeight,
        resolution
      );

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas context could not be initialized.'));
        return;
      }

      // Capture audio track directly from media stream
      let audioTracks: MediaStreamTrack[] = [];
      try {
        const rawStream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream();
        if (rawStream) {
          audioTracks = rawStream.getAudioTracks();
        }
      } catch {
        // Continue if audio capture isn't accessible
      }

      const canvasStream = canvas.captureStream(30); // 30 FPS capture
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);

      const targetBitrate = getTargetBitrate(height, level);
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(combinedStream, {
          mimeType: selectedMime,
          videoBitsPerSecond: targetBitrate,
        });
      } catch {
        recorder = new MediaRecorder(combinedStream);
      }

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const compressedBlob = new Blob(chunks, { type: selectedMime });
        const compressedSize = compressedBlob.size;
        const originalSize = file.size;
        const diff = originalSize - compressedSize;
        const savingsPercent = diff > 0 ? Math.round((diff / originalSize) * 100) : 0;

        resolve({
          blob: compressedBlob,
          url: URL.createObjectURL(compressedBlob),
          originalSize,
          compressedSize,
          savingsPercent,
        });
      };

      recorder.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };

      recorder.start(100);

      let isCancelled = false;

      const drawFrame = () => {
        if (isCancelled) return;

        if (video.paused || video.ended) {
          if (video.ended) {
            recorder.stop();
          }
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);

        if (onProgress && video.duration > 0) {
          const percent = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
          onProgress({ percent, currentTime: video.currentTime });
        }

        requestAnimationFrame(drawFrame);
      };

      video
        .play()
        .then(() => {
          requestAnimationFrame(drawFrame);
        })
        .catch((err) => {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        });

      video.onended = () => {
        isCancelled = true;
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read video file.'));
    };
  });
};