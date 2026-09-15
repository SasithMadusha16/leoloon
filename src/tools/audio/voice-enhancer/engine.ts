// src/tools/audio/voice-enhancer/engine.ts

export type EnhancerPresetId = 'podcast' | 'crisp' | 'warm' | 'de-noise';

export interface EnhancerSettings {
  lowCutFreq: number; // Hz (80 - 150)
  presenceGain: number; // dB (0 - 8)
  airGain: number; // dB (0 - 6)
  compressorRatio: number; // 2 - 8
  noiseGateThreshold: number; // dB (-60 to -30)
}

export interface EnhanceResult {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
}

export const PRESET_CONFIGS: Record<EnhancerPresetId, EnhancerSettings> = {
  podcast: {
    lowCutFreq: 90,
    presenceGain: 3.5,
    airGain: 2.5,
    compressorRatio: 4,
    noiseGateThreshold: -48,
  },
  crisp: {
    lowCutFreq: 120,
    presenceGain: 6.0,
    airGain: 4.5,
    compressorRatio: 5,
    noiseGateThreshold: -42,
  },
  warm: {
    lowCutFreq: 75,
    presenceGain: 2.0,
    airGain: 1.5,
    compressorRatio: 3,
    noiseGateThreshold: -50,
  },
  'de-noise': {
    lowCutFreq: 130,
    presenceGain: 3.0,
    airGain: 1.0,
    compressorRatio: 6,
    noiseGateThreshold: -38,
  },
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

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
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

// Apply soft noise gate during pause intervals
const applyNoiseGate = (buffer: AudioBuffer, thresholdDb: number) => {
  const thresholdAmp = Math.pow(10, thresholdDb / 20);
  const windowSize = 512;

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i += windowSize) {
      let sumSquares = 0;
      const limit = Math.min(i + windowSize, data.length);
      for (let j = i; j < limit; j++) {
        sumSquares += data[j] * data[j];
      }
      const rms = Math.sqrt(sumSquares / (limit - i));
      if (rms < thresholdAmp) {
        for (let j = i; j < limit; j++) {
          data[j] *= 0.15; // Smoothly damp room noise by ~85%
        }
      }
    }
  }
};

// 100% Client-Side DSP Pipeline using OfflineAudioContext
export const enhanceAudioClientSide = async (
  file: File,
  settings: EnhancerSettings
): Promise<EnhanceResult> => {
  const rawData = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const baseCtx = new AudioCtx();
  const decodedBuffer = await baseCtx.decodeAudioData(rawData);
  await baseCtx.close();

  const sampleRate = decodedBuffer.sampleRate;
  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtx(
    decodedBuffer.numberOfChannels,
    decodedBuffer.length,
    sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;

  // 1. High-Pass Filter (Rumble & Hum cut)
  const highPass = offlineCtx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = settings.lowCutFreq;
  highPass.Q.value = 0.7;

  // 2. Vocal Presence Boost (Speech clarity around 3.2kHz)
  const presenceBoost = offlineCtx.createBiquadFilter();
  presenceBoost.type = 'peaking';
  presenceBoost.frequency.value = 3200;
  presenceBoost.Q.value = 1.2;
  presenceBoost.gain.value = settings.presenceGain;

  // 3. Air & Brilliance (Smooth high-shelf at 10kHz)
  const airShelf = offlineCtx.createBiquadFilter();
  airShelf.type = 'highshelf';
  airShelf.frequency.value = 10000;
  airShelf.gain.value = settings.airGain;

  // 4. Dynamics Compressor (Radio/Podcast vocal leveling)
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 10;
  compressor.ratio.value = settings.compressorRatio;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // 5. Output Makeup Gain
  const outputGain = offlineCtx.createGain();
  outputGain.gain.value = 1.35; // Gentle makeup amplification

  // Wire pipeline: source -> highpass -> presence -> air -> compressor -> makeup -> destination
  source.connect(highPass);
  highPass.connect(presenceBoost);
  presenceBoost.connect(airShelf);
  airShelf.connect(compressor);
  compressor.connect(outputGain);
  outputGain.connect(offlineCtx.destination);

  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();

  // Apply subtle soft-noise gate on the rendered buffer
  applyNoiseGate(renderedBuffer, settings.noiseGateThreshold);

  const wavBlob = audioBufferToWav(renderedBuffer);

  return {
    blob: wavBlob,
    url: URL.createObjectURL(wavBlob),
    duration: renderedBuffer.duration,
    size: wavBlob.size,
  };
};