// src/tools/qr/studio/engine.ts
import QRCode from 'qrcode';

export type QrDataType = 'url' | 'wifi' | 'vcard' | 'whatsapp' | 'crypto' | 'email' | 'sms' | 'text';
export type DotStyle = 'square' | 'rounded' | 'dots' | 'diamond';
export type EyeOuterStyle = 'square' | 'rounded' | 'circle';
export type EyeInnerStyle = 'square' | 'circle' | 'diamond';
export type GradientType = 'none' | 'linear-h' | 'linear-v' | 'linear-diag' | 'radial';

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  title: string;
  website: string;
}

export interface WhatsAppData {
  phone: string;
  message: string;
}

export interface CryptoData {
  coin: 'BTC' | 'ETH' | 'SOL' | 'USDT';
  address: string;
  amount: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface SmsData {
  phone: string;
  message: string;
}

export interface QrDesignConfig {
  dotStyle: DotStyle;
  eyeOuterStyle: EyeOuterStyle;
  eyeInnerStyle: EyeInnerStyle;
  fgColor: string;
  bgColor: string;
  transparentBg: boolean;
  eyeColor: string;
  gradientType: GradientType;
  gradientColor2: string;
  logoDataUrl?: string;
  logoSizePercent: number; // 15 - 28
  frameStyle: 'none' | 'bottom-pill' | 'top-header' | 'border-box';
  frameText: string;
  frameColor: string;
}

// Convert formatted parameters into scanner-compatible string
export const formatQrPayload = (
  type: QrDataType,
  raw: {
    urlText: string;
    wifi: WifiData;
    vcard: VCardData;
    whatsapp: WhatsAppData;
    crypto: CryptoData;
    email: EmailData;
    sms: SmsData;
    plainText: string;
  }
): string => {
  switch (type) {
    case 'wifi': {
      const { ssid, password, encryption, hidden } = raw.wifi;
      return `WIFI:S:${ssid};T:${encryption};P:${password};H:${hidden};;`;
    }

    case 'vcard': {
      const v = raw.vcard;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${v.lastName};${v.firstName};;;`,
        `FN:${v.firstName} ${v.lastName}`.trim(),
        v.company ? `ORG:${v.company};` : '',
        v.title ? `TITLE:${v.title}` : '',
        v.phone ? `TEL;TYPE=CELL:${v.phone}` : '',
        v.email ? `EMAIL:${v.email}` : '',
        v.website ? `URL:${v.website}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'whatsapp': {
      const cleanPhone = raw.whatsapp.phone.replace(/[^\d]/g, '');
      const encodedMsg = encodeURIComponent(raw.whatsapp.message);
      return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
    }

    case 'crypto': {
      const c = raw.crypto;
      const coinU = c.coin.toLowerCase();
      if (coinU === 'btc') {
        return `bitcoin:${c.address}${c.amount ? `?amount=${c.amount}` : ''}`;
      }
      if (coinU === 'eth') {
        return `ethereum:${c.address}${c.amount ? `?value=${c.amount}` : ''}`;
      }
      return `${c.coin}:${c.address}`;
    }

    case 'email': {
      const e = raw.email;
      return `mailto:${e.to}?subject=${encodeURIComponent(e.subject)}&body=${encodeURIComponent(e.body)}`;
    }

    case 'sms': {
      const s = raw.sms;
      return `smsto:${s.phone}:${s.message}`;
    }

    case 'text':
      return raw.plainText || 'Leoloon QR Studio';

    case 'url':
    default:
      return raw.urlText || 'https://leoloon.com';
  }
};

// Check if given coordinate is inside one of the 3 Corner Eyes (Position Detection Patterns)
export const isCornerEye = (row: number, col: number, moduleCount: number): boolean => {
  // Top-Left Eye: 0..6 rows, 0..6 cols
  if (row < 7 && col < 7) return true;
  // Top-Right Eye: 0..6 rows, (moduleCount - 7)..moduleCount cols
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-Left Eye: (moduleCount - 7)..moduleCount rows, 0..6 cols
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
};

// Draw custom styled eye corners
const drawEye = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  outerStyle: EyeOuterStyle,
  innerStyle: EyeInnerStyle,
  color: string
) => {
  ctx.save();
  ctx.fillStyle = color;

  const eyeWidth = cellSize * 7;

  // 1. Draw Outer 7x7 Ring
  ctx.beginPath();
  if (outerStyle === 'rounded') {
    const r = cellSize * 2;
    ctx.roundRect(x, y, eyeWidth, eyeWidth, r);
  } else if (outerStyle === 'circle') {
    ctx.arc(x + eyeWidth / 2, y + eyeWidth / 2, eyeWidth / 2, 0, Math.PI * 2);
  } else {
    ctx.rect(x, y, eyeWidth, eyeWidth);
  }
  ctx.fill();

  // Cut out 5x5 Inner white ring
  ctx.globalCompositeOperation = 'destination-out';
  const innerCutX = x + cellSize;
  const innerCutY = y + cellSize;
  const innerCutSize = cellSize * 5;

  ctx.beginPath();
  if (outerStyle === 'rounded') {
    ctx.roundRect(innerCutX, innerCutY, innerCutSize, innerCutSize, cellSize * 1.2);
  } else if (outerStyle === 'circle') {
    ctx.arc(x + eyeWidth / 2, y + eyeWidth / 2, innerCutSize / 2, 0, Math.PI * 2);
  } else {
    ctx.rect(innerCutX, innerCutY, innerCutSize, innerCutSize);
  }
  ctx.fill();

  // 2. Draw 3x3 Center Eyeball
  ctx.globalCompositeOperation = 'source-over';
  const pupilX = x + cellSize * 2;
  const pupilY = y + cellSize * 2;
  const pupilSize = cellSize * 3;

  ctx.beginPath();
  if (innerStyle === 'circle') {
    ctx.arc(x + eyeWidth / 2, y + eyeWidth / 2, pupilSize / 2, 0, Math.PI * 2);
  } else if (innerStyle === 'diamond') {
    ctx.moveTo(pupilX + pupilSize / 2, pupilY);
    ctx.lineTo(pupilX + pupilSize, pupilY + pupilSize / 2);
    ctx.lineTo(pupilX + pupilSize / 2, pupilY + pupilSize);
    ctx.lineTo(pupilX, pupilY + pupilSize / 2);
    ctx.closePath();
  } else {
    ctx.roundRect(pupilX, pupilY, pupilSize, pupilSize, cellSize * 0.7);
  }
  ctx.fill();

  ctx.restore();
};

// Render full Designer QR Code into HTML5 Canvas
export const renderQrToCanvas = async (
  canvas: HTMLCanvasElement,
  payload: string,
  config: QrDesignConfig,
  targetSize = 1024
): Promise<void> => {
  // Use High error correction (30%) if logo is embedded, otherwise Quartile (25%)
  const ecc = config.logoDataUrl ? 'H' : 'Q';
  const qrData = QRCode.create(payload, { errorCorrectionLevel: ecc });
  const modules = qrData.modules;
  const moduleCount = modules.size;

  const hasFrame = config.frameStyle !== 'none';
  const frameTopPadding = config.frameStyle === 'top-header' ? 140 : 50;

  const qrDrawSize = targetSize - 100;
  canvas.width = targetSize;
  canvas.height = targetSize + (hasFrame ? (config.frameStyle === 'bottom-pill' ? 100 : 70) : 0);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  if (!config.transparentBg) {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const offsetX = Math.round((canvas.width - qrDrawSize) / 2);
  const offsetY = hasFrame ? (config.frameStyle === 'top-header' ? frameTopPadding : 50) : offsetX;
  const cellSize = qrDrawSize / moduleCount;

  // Prepare Color Gradient or Solid Fill for data modules
  let dataFill: string | CanvasGradient = config.fgColor;
  if (config.gradientType !== 'none') {
    let grad: CanvasGradient;
    if (config.gradientType === 'linear-h') {
      grad = ctx.createLinearGradient(offsetX, 0, offsetX + qrDrawSize, 0);
    } else if (config.gradientType === 'linear-v') {
      grad = ctx.createLinearGradient(0, offsetY, 0, offsetY + qrDrawSize);
    } else if (config.gradientType === 'linear-diag') {
      grad = ctx.createLinearGradient(offsetX, offsetY, offsetX + qrDrawSize, offsetY + qrDrawSize);
    } else {
      grad = ctx.createRadialGradient(
        offsetX + qrDrawSize / 2,
        offsetY + qrDrawSize / 2,
        10,
        offsetX + qrDrawSize / 2,
        offsetY + qrDrawSize / 2,
        qrDrawSize / 1.5
      );
    }
    grad.addColorStop(0, config.fgColor);
    grad.addColorStop(1, config.gradientColor2);
    dataFill = grad;
  }

  // Draw Center Logo Cutout Zone boundaries (modules around center to avoid drawing)
  const centerCoord = Math.floor(moduleCount / 2);
  const logoModRadius = config.logoDataUrl ? Math.ceil((moduleCount * (config.logoSizePercent / 100)) / 2) : 0;

  // 1. Draw Data Modules (excluding 3 corner eyes and center logo cutout)
  ctx.fillStyle = dataFill;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (!modules.get(r, c)) continue;
      if (isCornerEye(r, c, moduleCount)) continue;

      // Skip under center logo zone
      if (
        config.logoDataUrl &&
        r >= centerCoord - logoModRadius &&
        r <= centerCoord + logoModRadius &&
        c >= centerCoord - logoModRadius &&
        c <= centerCoord + logoModRadius
      ) {
        continue;
      }

      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      ctx.beginPath();
      if (config.dotStyle === 'dots') {
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2.3, 0, Math.PI * 2);
      } else if (config.dotStyle === 'rounded') {
        ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.4);
      } else if (config.dotStyle === 'diamond') {
        ctx.moveTo(x + cellSize / 2, y);
        ctx.lineTo(x + cellSize, y + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, y + cellSize);
        ctx.lineTo(x, y + cellSize / 2);
        ctx.closePath();
      } else {
        ctx.rect(x, y, cellSize + 0.2, cellSize + 0.2);
      }
      ctx.fill();
    }
  }

  // 2. Draw 3 Position Eyes
  const eyeColor = config.eyeColor || config.fgColor;
  // Top-Left
  drawEye(ctx, offsetX, offsetY, cellSize, config.eyeOuterStyle, config.eyeInnerStyle, eyeColor);
  // Top-Right
  drawEye(ctx, offsetX + (moduleCount - 7) * cellSize, offsetY, cellSize, config.eyeOuterStyle, config.eyeInnerStyle, eyeColor);
  // Bottom-Left
  drawEye(ctx, offsetX, offsetY + (moduleCount - 7) * cellSize, cellSize, config.eyeOuterStyle, config.eyeInnerStyle, eyeColor);

  // 3. Draw Center Logo if provided
  if (config.logoDataUrl) {
    const logoImg = new Image();
    logoImg.src = config.logoDataUrl;
    await new Promise((res) => {
      logoImg.onload = () => res(null);
      logoImg.onerror = () => res(null);
    });

    if (logoImg.width > 0) {
      const logoPixSize = qrDrawSize * (config.logoSizePercent / 100);
      const logoX = offsetX + (qrDrawSize - logoPixSize) / 2;
      const logoY = offsetY + (qrDrawSize - logoPixSize) / 2;
      const pad = 12;

      // Protective cutout background for logo
      ctx.fillStyle = config.transparentBg ? '#ffffff' : config.bgColor;
      ctx.beginPath();
      ctx.roundRect(logoX - pad, logoY - pad, logoPixSize + pad * 2, logoPixSize + pad * 2, 16);
      ctx.fill();

      // Subtle shadow around logo
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, logoPixSize, logoPixSize, 12);
      ctx.clip();
      ctx.drawImage(logoImg, logoX, logoY, logoPixSize, logoPixSize);
      ctx.restore();
    }
  }

  // 4. Draw Marketing Frame ("SCAN ME" CTA)
  if (hasFrame) {
    ctx.fillStyle = config.frameColor;

    if (config.frameStyle === 'bottom-pill') {
      const pillY = offsetY + qrDrawSize + 24;
      const pillHeight = 64;
      const pillWidth = qrDrawSize * 0.75;
      const pillX = offsetX + (qrDrawSize - pillWidth) / 2;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 32);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.frameText || 'SCAN ME', pillX + pillWidth / 2, pillY + pillHeight / 2);
    } else if (config.frameStyle === 'top-header') {
      const headerY = 24;
      const headerHeight = 60;
      const headerWidth = qrDrawSize * 0.8;
      const headerX = offsetX + (qrDrawSize - headerWidth) / 2;

      ctx.beginPath();
      ctx.roundRect(headerX, headerY, headerWidth, headerHeight, 30);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.frameText || 'SCAN TO CONNECT', headerX + headerWidth / 2, headerY + headerHeight / 2);
    }
  }
};

// Generate pure SVG vector for printing and billboards
export const exportQrAsSvg = async (payload: string, config: QrDesignConfig): Promise<string> => {
  const ecc = config.logoDataUrl ? 'H' : 'Q';
  const qrData = QRCode.create(payload, { errorCorrectionLevel: ecc });
  const modules = qrData.modules;
  const count = modules.size;
  const size = 600;
  const cellSize = size / count;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules.get(r, c)) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const cs = cellSize.toFixed(2);
        const rad = config.dotStyle === 'rounded' ? (cellSize * 0.35).toFixed(2) : '0';
        rects += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="${rad}" fill="${config.fgColor}" />\n`;
      }
    }
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
  ${!config.transparentBg ? `<rect width="100%" height="100%" fill="${config.bgColor}"/>` : ''}
  ${rects}
</svg>`;
};