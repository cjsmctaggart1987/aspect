#!/usr/bin/env node
/**
 * Derives apple-touch-icon-180.png from aspect-mark-512.png.
 *
 * WHY THIS EXISTS RATHER THAN A DRAWING
 *
 * The mark is geometry — make-brand.cjs writes every SVG from three arc angles.
 * iOS wants a raster, and there is no rasteriser on this machine, so the one
 * PNG that has to exist at a second size is resampled from the 512 rather than
 * redrawn. Redrawing it would mean two sources of truth for a mark whose whole
 * point is that it is one.
 *
 * Area-average resampling: each destination pixel is the mean of the source
 * pixels it covers, weighted by how much of each it covers. For a 512 to 180
 * reduction that is the right filter — bilinear would sample 4 pixels out of
 * the 8.1 that fall under each destination pixel and alias the compass ticks
 * into a shimmer.
 *
 * Alpha is premultiplied before averaging and divided out after. Averaging
 * straight RGBA darkens every edge against the transparent surround, because
 * fully transparent pixels drag their meaningless colour into the mean.
 *
 * PNG in, PNG out, using zlib only: 8-bit RGBA, non-interlaced, which is what
 * aspect-mark-512.png is. It checks rather than assumes.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC = path.join(__dirname, 'aspect-mark-512.png');
const DEST = path.join(__dirname, 'apple-touch-icon-180.png');
const SIZE = 180;

// --- read -------------------------------------------------------------------

function readPng(file) {
  const buf = fs.readFileSync(file);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error(`${file}: not a PNG`);

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const [depth, colour, , , interlace] = [buf[24], buf[25], buf[26], buf[27], buf[28]];
  if (depth !== 8 || colour !== 6 || interlace !== 0) {
    throw new Error(`${file}: expected 8-bit RGBA, non-interlaced; got depth ${depth}, `
      + `colour type ${colour}, interlace ${interlace}`);
  }

  const idat = [];
  let at = 8;
  while (at < buf.length) {
    const len = buf.readUInt32BE(at);
    const type = buf.toString('ascii', at + 4, at + 8);
    if (type === 'IDAT') idat.push(buf.subarray(at + 8, at + 8 + len));
    at += 12 + len;
  }
  return { width, height, raw: zlib.inflateSync(Buffer.concat(idat)) };
}

/** Undo the per-scanline filters. Five of them, all defined in the spec. */
function unfilter({ width, height, raw }) {
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const type = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;        // left
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;           // above
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;  // above-left
      let v = line[x];
      if (type === 1) v += a;
      else if (type === 2) v += b;
      else if (type === 3) v += (a + b) >> 1;
      else if (type === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      } else if (type !== 0) throw new Error(`unknown filter ${type} on row ${y}`);
      out[y * stride + x] = v & 0xff;
    }
  }
  return out;
}

// --- resample ---------------------------------------------------------------

function areaResample(px, sw, sh, size) {
  const out = Buffer.alloc(size * size * 4);
  const scale = sw / size;
  for (let dy = 0; dy < size; dy++) {
    const y0 = dy * scale, y1 = (dy + 1) * scale;
    for (let dx = 0; dx < size; dx++) {
      const x0 = dx * scale, x1 = (dx + 1) * scale;
      let r = 0, g = 0, b = 0, a = 0, w = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
        const hy = Math.min(y1, sy + 1) - Math.max(y0, sy);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
          const hx = Math.min(x1, sx + 1) - Math.max(x0, sx);
          const weight = hy * hx;
          const i = (sy * sw + sx) * 4;
          const alpha = px[i + 3] / 255;
          // Premultiplied, so transparent pixels contribute no colour.
          r += px[i] * alpha * weight;
          g += px[i + 1] * alpha * weight;
          b += px[i + 2] * alpha * weight;
          a += px[i + 3] * weight;
          w += weight;
        }
      }
      const o = (dy * size + dx) * 4;
      const av = a / w;
      const un = av > 0 ? 255 / av : 0;          // divide the alpha back out
      out[o] = Math.min(255, Math.round((r / w) * un));
      out[o + 1] = Math.min(255, Math.round((g / w) * un));
      out[o + 2] = Math.min(255, Math.round((b / w) * un));
      out[o + 3] = Math.round(av);
    }
  }
  return out;
}

// --- write ------------------------------------------------------------------

const CRC = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return buf => {
    let c = -1;
    for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(file, px, size) {
  const stride = size * 4;
  // Filter 0 on every row. The image is flat colour and hard edges, so the
  // adaptive filters buy a few hundred bytes and cost reproducibility.
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;      // bit depth
  ihdr[9] = 6;      // RGBA
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

const png = readPng(SRC);
const pixels = unfilter(png);
writePng(DEST, areaResample(pixels, png.width, png.height, SIZE), SIZE);
console.log(`wrote ${path.basename(DEST)}  ${SIZE}x${SIZE}, `
  + `${fs.statSync(DEST).size} bytes, resampled from ${png.width}x${png.height}`);
