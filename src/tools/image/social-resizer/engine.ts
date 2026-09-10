// src/tools/image/social-resizer/engine.ts

export interface SocialPreset {
  id: string;
  platform: 'Instagram' | 'YouTube' | 'TikTok' | 'Twitter' | 'Facebook' | 'LinkedIn';
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  // Instagram
  { id: 'ig-square', platform: 'Instagram', name: 'Square Post', width: 1080, height: 1080, aspectRatio: '1:1' },
  { id: 'ig-portrait', platform: 'Instagram', name: 'Portrait Post', width: 1080, height: 1350, aspectRatio: '4:5' },
  { id: 'ig-story', platform: 'Instagram', name: 'Story / Reel', width: 1080, height: 1920, aspectRatio: '9:16' },
  { id: 'ig-landscape', platform: 'Instagram', name: 'Landscape Feed', width: 1080, height: 566, aspectRatio: '1.91:1' },

  // YouTube
  { id: 'yt-thumb', platform: 'YouTube', name: 'Video Thumbnail', width: 1280, height: 720, aspectRatio: '16:9' },
  { id: 'yt-banner', platform: 'YouTube', name: 'Channel Banner', width: 2560, height: 1440, aspectRatio: '16:9' },

  // TikTok
  { id: 'tt-cover', platform: 'TikTok', name: 'TikTok Full Screen', width: 1080, height: 1920, aspectRatio: '9:16' },

  // Twitter / X
  { id: 'tw-post', platform: 'Twitter', name: 'X / Twitter Post', width: 1200, height: 675, aspectRatio: '16:9' },
  { id: 'tw-header', platform: 'Twitter', name: 'Header Banner', width: 1500, height: 500, aspectRatio: '3:1' },

  // Facebook
  { id: 'fb-post', platform: 'Facebook', name: 'Facebook Feed', width: 1200, height: 630, aspectRatio: '1.91:1' },
  { id: 'fb-cover', platform: 'Facebook', name: 'Page Cover', width: 820, height: 312, aspectRatio: '2.6:1' },

  // LinkedIn
  { id: 'li-post', platform: 'LinkedIn', name: 'Shared Post', width: 1200, height: 627, aspectRatio: '1.91:1' },
  { id: 'li-banner', platform: 'LinkedIn', name: 'Profile Banner', width: 1584, height: 396, aspectRatio: '4:1' },
];

export interface RenderOptions {
  fitMode: 'cover' | 'contain';
  backdropType: 'blur' | 'color';
  backdropColor: string;
}

export const renderResizedImage = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  preset: SocialPreset,
  options: RenderOptions
) => {
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = preset.width / preset.height;

  if (options.fitMode === 'cover') {
    // Fill entire canvas, crop excess centered
    let renderW = preset.width;
    let renderH = preset.height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > targetRatio) {
      renderH = preset.height;
      renderW = preset.height * imgRatio;
      offsetX = (preset.width - renderW) / 2;
    } else {
      renderW = preset.width;
      renderH = preset.width / imgRatio;
      offsetY = (preset.height - renderH) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  } else {
    // Contain mode: entire image visible with backdrop
    if (options.backdropType === 'blur') {
      ctx.save();
      ctx.filter = 'blur(40px) brightness(0.7)';
      // Scale backdrop slightly larger to prevent blur edge clipping
      const scale = 1.15;
      const bW = preset.width * scale;
      const bH = preset.height * scale;
      const bX = (preset.width - bW) / 2;
      const bY = (preset.height - bH) / 2;
      ctx.drawImage(img, bX, bY, bW, bH);
      ctx.restore();
    } else {
      ctx.fillStyle = options.backdropColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw sharp contained image in center
    let renderW = preset.width;
    let renderH = preset.height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > targetRatio) {
      renderW = preset.width;
      renderH = preset.width / imgRatio;
      offsetY = (preset.height - renderH) / 2;
    } else {
      renderH = preset.height;
      renderW = preset.height * imgRatio;
      offsetX = (preset.width - renderW) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }
};

export const exportCanvasBlob = (
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export failed.'));
      },
      format,
      quality
    );
  });
};