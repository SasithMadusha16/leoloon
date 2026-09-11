// src/tools/video/trimmer/engine.ts

export interface TrimProgress {
  percent: number;
  currentTime: number;
}

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 100% In-browser video slicing using MediaStream Recording
export const trimVideoClientSide = (
  sourceUrl: string,
  startTime: number,
  endTime: number,
  onProgress?: (progress: TrimProgress) => void
): Promise<{ blob: Blob; url: string; size: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = sourceUrl;
    video.crossOrigin = 'anonymous';
    video.muted = false;
    video.volume = 0.05; // Low volume during export

    video.onloadedmetadata = () => {
      const duration = endTime - startTime;
      if (duration <= 0) {
        reject(new Error('End time must be greater than start time.'));
        return;
      }

      video.currentTime = startTime;

      video.onseeked = () => {
        // Detach onseeked so subsequent frame ticks don't re-trigger initialization
        video.onseeked = null;

        let stream: MediaStream;
        try {
          stream = (video as any).captureStream
            ? (video as any).captureStream()
            : (video as any).mozCaptureStream();
        } catch {
          reject(new Error('Browser does not support native media stream capture.'));
          return;
        }

        const mimeTypes = [
          'video/mp4;codecs=avc1,mp4a.40.2',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm',
        ];

        const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedMime });
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, size: blob.size });
        };

        recorder.onerror = (e) => {
          reject(e);
        };

        recorder.start(100);

        const checkTime = () => {
          if (video.currentTime >= endTime || video.ended) {
            video.pause();
            recorder.stop();
          } else {
            const currentOffset = Math.max(0, video.currentTime - startTime);
            const percent = Math.min(100, Math.round((currentOffset / duration) * 100));
            if (onProgress) {
              onProgress({ percent, currentTime: video.currentTime });
            }
            requestAnimationFrame(checkTime);
          }
        };

        video
          .play()
          .then(() => {
            requestAnimationFrame(checkTime);
          })
          .catch((err) => {
            reject(err);
          });
      };
    };

    video.onerror = () => {
      reject(new Error('Failed to read video file.'));
    };
  });
};