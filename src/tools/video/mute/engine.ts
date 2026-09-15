// src/tools/video/mute/engine.ts

export interface MuteProgress {
  percent: number;
  currentTime: number;
}

export interface MuteResult {
  blob: Blob;
  url: string;
  originalSize: number;
  mutedSize: number;
  savingsBytes: number;
  duration: number;
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
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 100% Client-Side Audio Stripping via Silent MediaStream Capture
export const stripAudioClientSide = (
  file: File,
  onProgress?: (progress: MuteProgress) => void
): Promise<MuteResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true; // Crucial: muted playback
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (duration <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid video duration.'));
        return;
      }

      let rawStream: MediaStream;
      try {
        rawStream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream();
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Browser does not support native media stream capture.'));
        return;
      }

      // Extract ONLY video tracks (stripping all audio tracks)
      const videoTracks = rawStream.getVideoTracks();
      if (videoTracks.length === 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No video track found in the provided file.'));
        return;
      }

      const silentStream = new MediaStream(videoTracks);

      // Estimate original video bitrate to preserve visual crispness
      const estimatedBitrate = Math.min(
        12_000_000,
        Math.max(1_500_000, Math.round(((file.size * 8) / duration) * 0.95))
      );

      const mimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(silentStream, {
          mimeType: selectedMime,
          videoBitsPerSecond: estimatedBitrate,
        });
      } catch {
        recorder = new MediaRecorder(silentStream);
      }

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const mutedBlob = new Blob(chunks, { type: selectedMime });
        const mutedSize = mutedBlob.size;
        const originalSize = file.size;
        const diff = originalSize - mutedSize;

        resolve({
          blob: mutedBlob,
          url: URL.createObjectURL(mutedBlob),
          originalSize,
          mutedSize,
          savingsBytes: diff > 0 ? diff : 0,
          duration,
        });
      };

      recorder.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };

      recorder.start(100);

      const checkTime = () => {
        if (video.paused || video.ended) {
          if (video.ended && recorder.state === 'recording') {
            recorder.stop();
          }
          return;
        }

        if (onProgress && duration > 0) {
          const percent = Math.min(100, Math.round((video.currentTime / duration) * 100));
          onProgress({ percent, currentTime: video.currentTime });
        }

        requestAnimationFrame(checkTime);
      };

      video
        .play()
        .then(() => {
          requestAnimationFrame(checkTime);
        })
        .catch((err) => {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        });

      video.onended = () => {
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