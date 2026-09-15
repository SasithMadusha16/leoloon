// src/tools/audio/speech-synthesis/engine.ts

export type SpeechPresetId = 'natural' | 'fast' | 'calm' | 'animated';

export interface SpeechSettings {
  rate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 1.5
  volume: number; // 0 - 1
}

export interface AudioExportResult {
  blob: Blob;
  url: string;
  size: number;
  duration: number;
}

export const SPEECH_PRESETS: Record<SpeechPresetId, SpeechSettings> = {
  natural: { rate: 1.0, pitch: 1.0, volume: 1.0 },
  fast: { rate: 1.4, pitch: 1.05, volume: 1.0 },
  calm: { rate: 0.8, pitch: 0.95, volume: 0.9 },
  animated: { rate: 1.15, pitch: 1.25, volume: 1.0 },
};

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

export const getTextStats = (text: string): { words: number; chars: number; readingTimeSecs: number } => {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readingTimeSecs = Math.ceil(words / 2.5);
  return { words, chars, readingTimeSecs };
};

export const loadBrowserVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const synth = window.speechSynthesis;
    let voices = synth.getVoices();

    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const handler = () => {
      voices = synth.getVoices();
      synth.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };

    synth.addEventListener('voiceschanged', handler);

    setTimeout(() => {
      resolve(synth.getVoices());
    }, 500);
  });
};

// Convert AudioBuffer to standard 16-bit PCM RIFF WAV Blob
export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = buffer.length * blockAlign;
  const headerByteLength = 44;
  const arrayBuffer = new ArrayBuffer(headerByteLength + dataByteLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
};

// 100% Client-Side Tab Audio Capture + Speech Synthesis to WAV
export const captureSpeechToWav = async (
  text: string,
  voice: SpeechSynthesisVoice | undefined,
  settings: SpeechSettings,
  onStatusUpdate?: (status: string) => void
): Promise<AudioExportResult> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Speech synthesis is not supported on this browser.');
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Screen/Tab audio capture is not supported on this device.');
  }

  onStatusUpdate?.('Waiting for tab audio permission...');

  let displayStream: MediaStream;
  try {
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch {
    throw new Error('Audio permission was cancelled.');
  }

  const audioTracks = displayStream.getAudioTracks();
  if (!audioTracks || audioTracks.length === 0) {
    displayStream.getTracks().forEach((t) => t.stop());
    throw new Error(
      "No audio stream captured! Please ensure you check 'Also share tab audio' or 'Share system audio' in the browser dialog."
    );
  }

  const audioStream = new MediaStream([audioTracks[0]]);
  const recorder = new MediaRecorder(audioStream);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = async () => {
      displayStream.getTracks().forEach((t) => t.stop());

      try {
        onStatusUpdate?.('Encoding into 16-bit Studio WAV...');
        const rawBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const arrayBuffer = await rawBlob.arrayBuffer();

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        await audioCtx.close();

        const wavBlob = audioBufferToWav(decodedBuffer);

        resolve({
          blob: wavBlob,
          url: URL.createObjectURL(wavBlob),
          size: wavBlob.size,
          duration: decodedBuffer.duration,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Audio encoding failed.'));
      }
    };

    recorder.start(100);

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    onStatusUpdate?.('Recording speech in real-time...');

    utterance.onend = () => {
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 400); // 400ms buffer to capture trailing sound
    };

    utterance.onerror = (e) => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      displayStream.getTracks().forEach((t) => t.stop());
      reject(e);
    };

    synth.speak(utterance);
  });
};