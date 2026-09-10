// src/tools/image/censor/engine.ts

export type CensorMode = 'pixelate' | 'blur' | 'blackout';

export interface CensorBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mode: CensorMode;
  intensity: number; // For pixelate (pixel size) or blur (blur radius)
  color?: string;    // For blackout
}

export const renderCensoredCanvas = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  boxes: CensorBox[],
  activeDraftBox: { x: number; y: number; width: number; height: number } | null
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Draw base image
  ctx.drawImage(img, 0, 0);

  // Apply each applied censor box
  boxes.forEach((box) => {
    const x = Math.max(0, Math.min(box.x, canvas.width));
    const y = Math.max(0, Math.min(box.y, canvas.height));
    const w = Math.min(box.width, canvas.width - x);
    const h = Math.min(box.height, canvas.height - y);

    if (w <= 0 || h <= 0) return;

    if (box.mode === 'blackout') {
      ctx.fillStyle = box.color || '#000000';
      ctx.fillRect(x, y, w, h);
    } else if (box.mode === 'pixelate') {
      const sampleSize = Math.max(4, Math.round(box.intensity));
      const scaledW = Math.max(1, Math.floor(w / sampleSize));
      const scaledH = Math.max(1, Math.floor(h / sampleSize));

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = scaledW;
      tempCanvas.height = scaledH;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(canvas, x, y, w, h, 0, 0, scaledW, scaledH);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, scaledW, scaledH, x, y, w, h);
        ctx.restore();
      }
    } else if (box.mode === 'blur') {
      // Snapshot current canvas state to safely blur region
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const snapCtx = snapshot.getContext('2d');

      if (snapCtx) {
        snapCtx.drawImage(canvas, 0, 0);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.filter = `blur(${Math.max(2, box.intensity)}px)`;
        ctx.drawImage(snapshot, 0, 0);
        ctx.restore();
      }
    }
  });

  // Draw active selection marquee if user is currently dragging
  if (activeDraftBox && activeDraftBox.width > 0 && activeDraftBox.height > 0) {
    ctx.save();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
    ctx.setLineDash([6, 6]);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.fillRect(activeDraftBox.x, activeDraftBox.y, activeDraftBox.width, activeDraftBox.height);
    ctx.strokeRect(activeDraftBox.x, activeDraftBox.y, activeDraftBox.width, activeDraftBox.height);
    ctx.restore();
  }
};

export const exportCanvasBlob = (
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.95
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

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};