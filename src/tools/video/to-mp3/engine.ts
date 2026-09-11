// src/tools/video/to-mp3/engine.ts

export interface AudioExtractOptions {
  sampleRate: 44100 | 48000;
  channels: 1 | 2; // 1 = Mono, 2 = Stereo
}

export interface ExtractedAudioResult {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  channels: number;
  sampleRate: number;
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

// Convert raw AudioBuffer to 16-bit PCM RIFF WAV Blob
export const audioBufferToWav = (buffer: AudioBuffer, optChannels: 1 | 2): Blob => {
  const numChannels = Math.min(buffer.numberOfChannels, optChannels);
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = Uncompressed PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const dataByteLength = length * blockAlign;
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // fmt Subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data Subchunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Interleave and write 16-bit PCM samples
  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
};

// 100% Client-Side Demuxing & Extraction via AudioContext
export const extractAudioFromVideo = async (
  file: File,
  options: AudioExtractOptions
): Promise<ExtractedAudioResult> => {
  const arrayBuffer = await file.arrayBuffer();

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioCtx({ sampleRate: options.sampleRate });

  try {
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWav(decodedBuffer, options.channels);

    return {
      blob: wavBlob,
      url: URL.createObjectURL(wavBlob),
      duration: decodedBuffer.duration,
      size: wavBlob.size,
      channels: options.channels,
      sampleRate: decodedBuffer.sampleRate,
    };
  } finally {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
};