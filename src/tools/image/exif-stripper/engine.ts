export interface DetectedMetadata {
  hasExif: boolean;
  cameraMake?: string;
  cameraModel?: string;
  dateTime?: string;
  software?: string;
  hasGps: boolean;
  gpsCoords?: string;
  iso?: string;
  dimensions?: string;
}

export interface CleanResult {
  blob: Blob;
  downloadUrl: string;
  size: number;
}

// Lightweight in-browser EXIF APP1 parser for JPEG
export const extractExifMetadata = async (file: File): Promise<DetectedMetadata> => {
  const result: DetectedMetadata = {
    hasExif: false,
    hasGps: false,
  };

  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Verify JPEG SOI marker (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) {
      return result;
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length - 4) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffe1) {
        // APP1 Marker (EXIF)
        const exifHeader = view.getUint32(offset + 2, false);

        // Check for 'Exif' ASCII header (0x45786966)
        if (exifHeader === 0x45786966) {
          result.hasExif = true;
          const tiffStart = offset + 8;
          const isLittleEndian = view.getUint16(tiffStart, false) === 0x4949;

          const ifdOffset = view.getUint32(tiffStart + 4, isLittleEndian);
          let currentOffset = tiffStart + ifdOffset;
          const tagsCount = view.getUint16(currentOffset, isLittleEndian);
          currentOffset += 2;

          for (let i = 0; i < tagsCount && currentOffset < length - 12; i++) {
            const tag = view.getUint16(currentOffset, isLittleEndian);
            const numValues = view.getUint32(currentOffset + 4, isLittleEndian);
            const valueOffset = tiffStart + view.getUint32(currentOffset + 8, isLittleEndian);

            if (numValues < 100 && valueOffset < length) {
              const readAscii = (start: number, count: number) => {
                let str = '';
                for (let j = 0; j < count - 1; j++) {
                  str += String.fromCharCode(view.getUint8(start + j));
                }
                return str.trim();
              };

              if (tag === 0x010f) result.cameraMake = readAscii(valueOffset, numValues);
              if (tag === 0x0110) result.cameraModel = readAscii(valueOffset, numValues);
              if (tag === 0x0131) result.software = readAscii(valueOffset, numValues);
              if (tag === 0x0132) result.dateTime = readAscii(valueOffset, numValues);
              if (tag === 0x8825) {
                result.hasGps = true;
                result.gpsCoords = 'Embedded GPS Latitude & Longitude detected';
              }
            }
            currentOffset += 12;
          }
        }
        break;
      } else if ((marker & 0xff00) !== 0xff00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
  } catch (err) {
    console.warn('EXIF parsing skipped:', err);
  }

  return result;
};

// Clean and strip 100% of metadata through raw canvas re-encoding
export const stripMetadataAndExport = (
  file: File,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality = 0.95
): Promise<CleanResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas rendering initialization failed.'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              downloadUrl: URL.createObjectURL(blob),
              size: blob.size,
            });
          } else {
            reject(new Error('Clean image conversion failed.'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image file.'));
    };

    img.src = objectUrl;
  });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};