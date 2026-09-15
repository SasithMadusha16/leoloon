export interface EditorSettings {
  brightness: number; // 0 - 200, default 100
  contrast: number;   // 0 - 200, default 100
  saturation: number; // 0 - 200, default 100
  grayscale: number;  // 0 - 100, default 0
  sepia: number;      // 0 - 100, default 0
  rotation: number;   // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

export const defaultSettings: EditorSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
};

export const applyTransformsAndFilters = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  settings: EditorSettings
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isRotated90or270 = settings.rotation === 90 || settings.rotation === 270;
  canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply visual filters
  ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) grayscale(${settings.grayscale}%) sepia(${settings.sepia}%)`;

  ctx.save();

  // Move origin to center for rotation & flipping
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((settings.rotation * Math.PI) / 180);
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);

  ctx.drawImage(
    img,
    -img.naturalWidth / 2,
    -img.naturalHeight / 2,
    img.naturalWidth,
    img.naturalHeight
  );

  ctx.restore();
};

export const exportCanvasToBlob = (
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png',
  quality = 0.92
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      format,
      quality
    );
  });
};