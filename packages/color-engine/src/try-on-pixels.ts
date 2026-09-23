import type { TryOnFeature, TryOnLook } from "@photomatcher/types";

export type TryOnEnabled = Record<TryOnFeature, boolean>;

type Rgb = { r: number; g: number; b: number };

const STRENGTH: Record<TryOnFeature, number> = {
  hair: 0.92,
  eyes: 0.88,
  lips: 0.86,
  cheeks: 0.22,
  jewelry: 0.8,
  dress: 0.86,
};

function hexToRgb(hex: string): Rgb {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h / 6, s, l };
}

function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

function dye(r: number, g: number, b: number, tr: number, tg: number, tb: number, amount: number) {
  const src = rgbToHsl(r, g, b);
  const tgt = rgbToHsl(tr, tg, tb);
  const shine = src.l > 0.78 ? 0.45 : 1;
  const a = Math.min(1, amount * shine);
  const next = hslToRgb(tgt.h, Math.min(1, Math.max(tgt.s, 0.38)), src.l * 0.62 + tgt.l * 0.38);
  return {
    r: r + (next.r - r) * a,
    g: g + (next.g - g) * a,
    b: b + (next.b - b) * a,
  };
}

function emptyMask(n: number) {
  return new Float32Array(n);
}

function blurMask(mask: Float32Array, w: number, h: number, radius: number) {
  if (radius <= 0) return mask;
  const tmp = emptyMask(mask.length);
  const out = emptyMask(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let k = -radius; k <= radius; k++) {
        sum += mask[y * w + Math.min(w - 1, Math.max(0, x + k))];
        n++;
      }
      tmp[y * w + x] = sum / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let k = -radius; k <= radius; k++) {
        sum += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
        n++;
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

function isFoliageOrSky(r: number, g: number, b: number) {
  if (g > r * 1.12 && g > b * 0.92) return true;
  if (b > r * 1.12 && b > g && 0.2126 * r + 0.7152 * g + 0.0722 * b > 90) return true;
  return false;
}

function skinScore(r: number, g: number, b: number) {
  if (isFoliageOrSky(r, g, b)) return 0;
  if (r < 55 || g < 25) return 0;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  if (y < 45 || y > 250) return 0;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  if (cr < 128 || cr > 185) return 0;
  if (cb < 72 || cb > 140) return 0;
  if (r < g - 8) return 0;
  return 1;
}

function faceBox(skin: Float32Array, w: number, h: number) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skin[y * w + x] < 0.4) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) {
    return {
      minX: Math.floor(w * 0.28),
      minY: Math.floor(h * 0.12),
      maxX: Math.floor(w * 0.72),
      maxY: Math.floor(h * 0.58),
      bw: Math.floor(w * 0.44),
      bh: Math.floor(h * 0.46),
    };
  }
  return { minX, minY, maxX, maxY, bw: maxX - minX, bh: maxY - minY };
}

function fillEllipse(
  mask: Float32Array,
  w: number,
  h: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  value: number,
) {
  const px = cx * w;
  const py = cy * h;
  const prx = Math.max(1, rx * w);
  const pry = Math.max(1, ry * h);
  const x0 = Math.max(0, Math.floor(px - prx));
  const x1 = Math.min(w - 1, Math.ceil(px + prx));
  const y0 = Math.max(0, Math.floor(py - pry));
  const y1 = Math.min(h - 1, Math.ceil(py + pry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x - px) / prx;
      const ny = (y - py) / pry;
      const d = nx * nx + ny * ny;
      if (d <= 1) mask[y * w + x] = Math.max(mask[y * w + x], (1 - d) * (1 - d) * value);
    }
  }
}

function buildMasks(pixels: Uint8Array, w: number, h: number) {
  const n = w * h;
  const skin = emptyMask(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    skin[i] = skinScore(pixels[p], pixels[p + 1], pixels[p + 2]);
  }
  const box = faceBox(skin, w, h);
  const { minX, minY, maxX, bw, bh } = box;
  const cx = (minX + bw / 2) / w;

  const hair = emptyMask(n);
  const y0 = Math.max(0, Math.floor(minY - bh * 0.95));
  const y1 = Math.min(h - 1, Math.floor(minY + bh * 0.32));
  const x0 = Math.max(0, Math.floor(minX - bw * 0.28));
  const x1 = Math.min(w - 1, Math.floor(maxX + bw * 0.28));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (skin[i] > 0.45) continue;
      const p = i * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      if (isFoliageOrSky(r, g, b)) continue;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum > 0.68) continue;
      const nx = (x / w - cx) / 0.34;
      const ny = (y / h - minY / h + 0.08) / 0.28;
      if (nx * nx + ny * ny > 1.25) continue;
      hair[i] = lum < 0.28 ? 0.98 : 0.82;
    }
  }

  const lips = emptyMask(n);
  const eyes = emptyMask(n);
  const cheeks = emptyMask(n);
  const jewelry = emptyMask(n);
  const dress = emptyMask(n);

  fillEllipse(lips, w, h, cx, (minY + bh * 0.78) / h, (bw * 0.16) / w, (bh * 0.05) / h, 1);
  fillEllipse(eyes, w, h, (minX + bw * 0.35) / w, (minY + bh * 0.38) / h, (bw * 0.042) / w, (bh * 0.026) / h, 1);
  fillEllipse(eyes, w, h, (minX + bw * 0.65) / w, (minY + bh * 0.38) / h, (bw * 0.042) / w, (bh * 0.026) / h, 1);
  fillEllipse(cheeks, w, h, (minX + bw * 0.28) / w, (minY + bh * 0.56) / h, (bw * 0.1) / w, (bh * 0.075) / h, 0.85);
  fillEllipse(cheeks, w, h, (minX + bw * 0.72) / w, (minY + bh * 0.56) / h, (bw * 0.1) / w, (bh * 0.075) / h, 0.85);
  fillEllipse(jewelry, w, h, (minX - bw * 0.04) / w, (minY + bh * 0.55) / h, (bw * 0.035) / w, (bh * 0.06) / h, 0.9);
  fillEllipse(jewelry, w, h, (maxX + bw * 0.04) / w, (minY + bh * 0.55) / h, (bw * 0.035) / w, (bh * 0.06) / h, 0.9);

  for (let i = 0; i < n; i++) {
    if (cheeks[i] && skin[i] < 0.2) cheeks[i] = 0;
    if (lips[i] && hair[i] > 0.4) lips[i] = 0;
    if (eyes[i] && hair[i] > 0.45) eyes[i] = 0;
  }

  const dressY0 = Math.min(h - 1, Math.floor(box.maxY + bh * 0.06));
  for (let y = dressY0; y < h; y++) {
    for (let x = Math.max(0, minX - Math.floor(bw * 0.2)); x <= Math.min(w - 1, maxX + Math.floor(bw * 0.2)); x++) {
      const i = y * w + x;
      if (skin[i] > 0.4 || hair[i] > 0.4) continue;
      const p = i * 4;
      if (isFoliageOrSky(pixels[p], pixels[p + 1], pixels[p + 2])) continue;
      const lum = (0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2]) / 255;
      if (lum < 0.1 || lum > 0.9) continue;
      dress[i] = 0.82;
    }
  }

  return {
    hair: blurMask(hair, w, h, 2),
    eyes: blurMask(eyes, w, h, 1),
    lips: blurMask(lips, w, h, 1),
    cheeks: blurMask(cheeks, w, h, 2),
    jewelry: blurMask(jewelry, w, h, 1),
    dress: blurMask(dress, w, h, 2),
  };
}

export function colorizePortraitRgba(
  pixels: Uint8Array,
  w: number,
  h: number,
  look: TryOnLook,
  enabled: TryOnEnabled,
) {
  const masks = buildMasks(pixels, w, h);
  const out = new Uint8Array(pixels);
  const hair = hexToRgb(look.hair);
  const eyes = hexToRgb(look.eyes);
  const lips = hexToRgb(look.lips);
  const cheeks = hexToRgb(look.cheeks);
  const jewelry = hexToRgb(look.jewelry);
  const dress = hexToRgb(look.dress);

  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    let r = pixels[p];
    let g = pixels[p + 1];
    let b = pixels[p + 2];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    const hairA = enabled.hair ? masks.hair[i] * STRENGTH.hair : 0;
    if (hairA > 0.12) {
      const c = dye(r, g, b, hair.r, hair.g, hair.b, hairA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const dressA = enabled.dress ? masks.dress[i] * STRENGTH.dress : 0;
    if (dressA > 0.16) {
      const c = dye(r, g, b, dress.r, dress.g, dress.b, dressA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const cheekA = enabled.cheeks ? masks.cheeks[i] * STRENGTH.cheeks : 0;
    if (cheekA > 0.12) {
      r = r + (cheeks.r - r) * cheekA * 0.32;
      g = g + (cheeks.g - g) * cheekA * 0.24;
      b = b + (cheeks.b - b) * cheekA * 0.2;
    }
    const lipA = enabled.lips ? masks.lips[i] * STRENGTH.lips : 0;
    if (lipA > 0.14) {
      const c = dye(r, g, b, lips.r, lips.g, lips.b, lipA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const eyeA = enabled.eyes ? masks.eyes[i] * STRENGTH.eyes : 0;
    if (eyeA > 0.16 && lum > 0.08 && lum < 0.55) {
      const c = dye(r, g, b, eyes.r, eyes.g, eyes.b, eyeA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const jewelA = enabled.jewelry ? masks.jewelry[i] * STRENGTH.jewelry : 0;
    if (jewelA > 0.18) {
      const c = dye(r, g, b, jewelry.r, jewelry.g, jewelry.b, jewelA);
      r = c.r;
      g = c.g;
      b = c.b;
    }

    out[p] = Math.max(0, Math.min(255, Math.round(r)));
    out[p + 1] = Math.max(0, Math.min(255, Math.round(g)));
    out[p + 2] = Math.max(0, Math.min(255, Math.round(b)));
    out[p + 3] = 255;
  }
  return out;
}
