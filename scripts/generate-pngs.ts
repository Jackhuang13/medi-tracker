import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      if ((crc ^ byte) & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
      byte >>>= 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width: number, height: number, isMaskable = false): Buffer {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.48 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background calculation
      const t = (x + y) / (width + height);
      // Teal #0f766e (15, 118, 110) to Cyan #0284c7 (2, 132, 199)
      let r = Math.round(15 * (1 - t) + 2 * t);
      let g = Math.round(118 * (1 - t) + 132 * t);
      let b = Math.round(110 * (1 - t) + 199 * t);
      let a = 255;

      // Outer shape rounded corner
      if (!isMaskable) {
        const cornerR = width * 0.22;
        const inCornerX = x < cornerR || x > width - cornerR;
        const inCornerY = y < cornerR || y > height - cornerR;
        if (inCornerX && inCornerY) {
          const cornerCx = x < cornerR ? cornerR : width - cornerR;
          const cornerCy = y < cornerR ? cornerR : height - cornerR;
          const cDist = Math.sqrt((x - cornerCx) ** 2 + (y - cornerCy) ** 2);
          if (cDist > cornerR) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Draw Medical Cross / Pill at center
        const pillScale = width / 512;
        // Rotated cross / pill
        const cos = Math.cos(Math.PI / 4);
        const sin = Math.sin(Math.PI / 4);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;

        // Pill Capsule bounds
        if (Math.abs(rx) < 48 * pillScale && Math.abs(ry) < 110 * pillScale) {
          if (ry < 0) {
            // Top half: sky blue
            r = 56; g = 189; b = 248;
          } else {
            // Bottom half: white
            r = 248; g = 250; b = 252;
          }
        } else if (
          (Math.abs(dx) < 22 * pillScale && Math.abs(dy) < 70 * pillScale) ||
          (Math.abs(dy) < 22 * pillScale && Math.abs(dx) < 70 * pillScale)
        ) {
          // Cross accent
          r = 255; g = 255; b = 255;
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.png'), createPng(192, 192, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, false));

console.log('Successfully generated all PWA PNG icons in public directory!');
