import type { TryOnFeature, TryOnLook } from "@photomatcher/types";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";

export type TryOnEnabled = Record<TryOnFeature, boolean>;

export const DEFAULT_TRYON_ENABLED: TryOnEnabled = {
  hair: true,
  eyes: true,
  lips: true,
  cheeks: true,
  jewelry: false,
  dress: false,
};

type Rgb = { r: number; g: number; b: number };

export type PortraitPixels = {
  original: Uint8Array;
  width: number;
  height: number;
  masks: Record<TryOnFeature, Float32Array>;
};

const STRENGTH: Record<TryOnFeature, number> = {
  hair: 0.84,
  eyes: 0.55,
  lips: 0.7,
  cheeks: 0.18,
  jewelry: 0.7,
  dress: 0.78,
};

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array | ArrayBuffer | ArrayLike<number>) {
  const view =
    bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes)
      : bytes instanceof Uint8Array
        ? bytes
        : Uint8Array.from(bytes as ArrayLike<number>);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < view.length; i += chunk) {
    binary += String.fromCharCode(...view.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function asUint8(data: Uint8Array | ArrayBuffer | ArrayLike<number>) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return Uint8Array.from(data as ArrayLike<number>);
}

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

function colorizeHair(r: number, g: number, b: number, tr: number, tg: number, tb: number, amount: number) {
  const src = rgbToHsl(r, g, b);
  const tgt = rgbToHsl(tr, tg, tb);
  const highlight = src.l > 0.78 ? 0.35 : 1;
  const a = Math.min(1, amount * highlight);
  const next = hslToRgb(tgt.h, Math.min(1, Math.max(tgt.s, 0.42)), src.l * 0.82 + tgt.l * 0.18);
  return {
    r: r + (next.r - r) * a,
    g: g + (next.g - g) * a,
    b: b + (next.b - b) * a,
  };
}

function colorizeSoft(r: number, g: number, b: number, tr: number, tg: number, tb: number, amount: number) {
  const src = rgbToHsl(r, g, b);
  const tgt = rgbToHsl(tr, tg, tb);
  const next = hslToRgb(tgt.h, Math.min(1, tgt.s * 0.92 + src.s * 0.08), src.l);
  const a = Math.min(1, amount * 1.15);
  return {
    r: r + (next.r - r) * a,
    g: g + (next.g - g) * a,
    b: b + (next.b - b) * a,
  };
}

function colorizeMetal(r: number, g: number, b: number, tr: number, tg: number, tb: number, amount: number) {
  const src = rgbToHsl(r, g, b);
  const tgt = rgbToHsl(tr, tg, tb);
  const shine = src.l > 0.62 ? 0.45 : 1;
  const a = Math.min(1, amount * shine);
  const next = hslToRgb(tgt.h, Math.min(1, tgt.s * 0.9), src.l * 0.5 + tgt.l * 0.5);
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
  if (b > r * 1.12 && b > g && (0.2126 * r + 0.7152 * g + 0.0722 * b) > 90) return true;
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

function densestBox(mask: Float32Array, w: number, h: number, threshold: number) {
  const col = new Float32Array(w);
  const row = new Float32Array(h);
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = mask[y * w + x];
      if (v < threshold) continue;
      col[x] += v;
      row[y] += v;
      total += v;
    }
  }
  if (total < 8) return null;
  let peakX = 0;
  let peakY = 0;
  for (let x = 1; x < w; x++) if (col[x] > col[peakX]) peakX = x;
  for (let y = 1; y < h; y++) if (row[y] > row[peakY]) peakY = y;
  const minCol = col[peakX] * 0.18;
  const minRow = row[peakY] * 0.18;
  let minX = peakX;
  let maxX = peakX;
  let minY = peakY;
  let maxY = peakY;
  while (minX > 0 && col[minX] >= minCol) minX--;
  while (maxX < w - 1 && col[maxX] >= minCol) maxX++;
  while (minY > 0 && row[minY] >= minRow) minY--;
  while (maxY < h - 1 && row[maxY] >= minRow) maxY++;
  return { minX, minY, maxX, maxY, bw: maxX - minX, bh: maxY - minY };
}

function buildMasks(pixels: Uint8Array, w: number, h: number) {
  const n = w * h;
  const skin = emptyMask(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    skin[i] = skinScore(pixels[p], pixels[p + 1], pixels[p + 2]);
  }
  const box = densestBox(skin, w, h, 0.5) ?? {
    minX: Math.floor(w * 0.28),
    minY: Math.floor(h * 0.12),
    maxX: Math.floor(w * 0.78),
    maxY: Math.floor(h * 0.62),
    bw: Math.floor(w * 0.5),
    bh: Math.floor(h * 0.5),
  };

  const cx = (box.minX + box.maxX) / 2;
  const faceLum: number[] = [];
  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      const i = y * w + x;
      if (skin[i] < 0.5) continue;
      const p = i * 4;
      faceLum.push(0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2]);
    }
  }
  faceLum.sort((a, b) => a - b);
  const skinLum = faceLum[Math.floor(faceLum.length * 0.5)] ?? 140;

  const hair = emptyMask(n);
  const lips = emptyMask(n);
  const eyes = emptyMask(n);
  const cheeks = emptyMask(n);
  const jewelry = emptyMask(n);
  const dress = emptyMask(n);

  const hairX0 = Math.max(0, Math.floor(box.minX - box.bw * 0.35));
  const hairX1 = Math.min(w - 1, Math.floor(box.maxX + box.bw * 0.55));
  const hairY0 = Math.max(0, Math.floor(box.minY - box.bh * 0.85));
  const hairY1 = Math.min(h - 1, Math.floor(box.maxY + box.bh * 0.45));

  for (let y = hairY0; y <= hairY1; y++) {
    for (let x = hairX0; x <= hairX1; x++) {
      const i = y * w + x;
      const p = i * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      if (isFoliageOrSky(r, g, b)) continue;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (skin[i] > 0.5 && lum > skinLum * 0.78) continue;
      if (lum > skinLum * 0.92 || lum > 175) continue;
      const nx = (x - cx) / Math.max(1, box.bw * 0.72);
      const ny = (y - (box.minY - box.bh * 0.15)) / Math.max(1, box.bh * 1.15);
      if (nx * nx + ny * ny > 1.35 && y < box.maxY) continue;
      hair[i] = lum < skinLum * 0.55 ? 0.95 : 0.7;
    }
  }

  const eyeY0 = Math.floor(box.minY + box.bh * 0.28);
  const eyeY1 = Math.floor(box.minY + box.bh * 0.5);
  const lipY0 = Math.floor(box.minY + box.bh * 0.62);
  const lipY1 = Math.floor(box.minY + box.bh * 0.84);
  const cheekY0 = Math.floor(box.minY + box.bh * 0.42);
  const cheekY1 = Math.floor(box.minY + box.bh * 0.68);

  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      const i = y * w + x;
      const p = i * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const fx = (x - box.minX) / Math.max(1, box.bw);
      const fy = (y - box.minY) / Math.max(1, box.bh);

      if (y >= eyeY0 && y <= eyeY1 && fx > 0.12 && fx < 0.88 && lum > 0.1 && lum < 0.42 && hair[i] < 0.4) {
        const left = Math.abs(fx - 0.32);
        const right = Math.abs(fx - 0.68);
        const d = Math.min(left, right);
        if (d < 0.14) eyes[i] = Math.max(0, 1 - d / 0.14) * (lum < 0.22 ? 0.55 : 0.9);
      }

      if (y >= lipY0 && y <= lipY1 && fx > 0.28 && fx < 0.72 && r > g + 6 && r > b && lum > 0.18 && lum < 0.78) {
        const dx = (fx - 0.5) / 0.18;
        const dy = (fy - 0.73) / 0.1;
        const d = dx * dx + dy * dy;
        if (d < 1) lips[i] = (1 - d) * 0.92;
      }

      if (skin[i] > 0.5 && y >= cheekY0 && y <= cheekY1) {
        const left = ((fx - 0.28) / 0.12) ** 2 + ((fy - 0.55) / 0.1) ** 2;
        const right = ((fx - 0.72) / 0.12) ** 2 + ((fy - 0.55) / 0.1) ** 2;
        const d = Math.min(left, right);
        if (d < 1) cheeks[i] = (1 - d) * 0.7;
      }

      if ((fx < 0.12 || fx > 0.88) && fy > 0.35 && fy < 0.7 && lum > 0.45) {
        jewelry[i] = 0.55;
      }
    }
  }

  const dressY0 = Math.min(h - 1, Math.floor(box.maxY + box.bh * 0.08));
  const dressY1 = Math.min(h - 1, Math.floor(h * 0.88));
  for (let y = dressY0; y <= dressY1; y++) {
    for (let x = Math.max(0, box.minX - Math.floor(box.bw * 0.25)); x <= Math.min(w - 1, box.maxX + Math.floor(box.bw * 0.35)); x++) {
      const i = y * w + x;
      if (skin[i] > 0.45 || hair[i] > 0.45) continue;
      const p = i * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      if (isFoliageOrSky(r, g, b)) continue;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum < 0.12 || lum > 0.88) continue;
      dress[i] = 0.78;
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

export async function loadPortraitPixels(uri: string): Promise<PortraitPixels> {
  const manipulated = await ImageManipulator.manipulateAsync(uri.split("?")[0], [{ resize: { width: 480 } }], {
    compress: 0.92,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!manipulated.base64) throw new Error("Could not read that photo");
  const decoded = jpeg.decode(base64ToBytes(manipulated.base64), { useTArray: true });
  const original = asUint8(decoded.data);
  return {
    original,
    width: decoded.width,
    height: decoded.height,
    masks: buildMasks(original, decoded.width, decoded.height),
  };
}

export async function renderPortraitLook(
  portrait: PortraitPixels,
  look: TryOnLook,
  enabled: TryOnEnabled,
  stamp: number,
) {
  const { original, width: w, height: h, masks } = portrait;
  const out = new Uint8Array(original);
  const hair = hexToRgb(look.hair);
  const eyes = hexToRgb(look.eyes);
  const lips = hexToRgb(look.lips);
  const cheeks = hexToRgb(look.cheeks);
  const jewelry = hexToRgb(look.jewelry);
  const dress = hexToRgb(look.dress);

  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    let r = original[p];
    let g = original[p + 1];
    let b = original[p + 2];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    const hairA = enabled.hair ? masks.hair[i] * STRENGTH.hair : 0;
    if (hairA > 0.04) {
      const c = colorizeHair(r, g, b, hair.r, hair.g, hair.b, hairA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const dressA = enabled.dress ? masks.dress[i] * STRENGTH.dress : 0;
    if (dressA > 0.05) {
      const c = colorizeHair(r, g, b, dress.r, dress.g, dress.b, dressA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const cheekA = enabled.cheeks ? masks.cheeks[i] * STRENGTH.cheeks : 0;
    if (cheekA > 0.03) {
      r = r + (cheeks.r - r) * cheekA * 0.28;
      g = g + (cheeks.g - g) * cheekA * 0.22;
      b = b + (cheeks.b - b) * cheekA * 0.2;
    }
    const lipA = enabled.lips ? masks.lips[i] * STRENGTH.lips : 0;
    if (lipA > 0.04) {
      const c = colorizeSoft(r, g, b, lips.r, lips.g, lips.b, lipA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const eyeA = enabled.eyes ? masks.eyes[i] * STRENGTH.eyes : 0;
    if (eyeA > 0.05 && lum > 0.12 && lum < 0.82) {
      const c = colorizeSoft(r, g, b, eyes.r, eyes.g, eyes.b, eyeA * 0.85);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const jewelA = enabled.jewelry ? masks.jewelry[i] * STRENGTH.jewelry : 0;
    if (jewelA > 0.05) {
      const c = colorizeMetal(r, g, b, jewelry.r, jewelry.g, jewelry.b, jewelA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    out[p] = Math.max(0, Math.min(255, Math.round(r)));
    out[p + 1] = Math.max(0, Math.min(255, Math.round(g)));
    out[p + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  const encoded = jpeg.encode({ data: out, width: w, height: h }, 86);
  const dest = `${FileSystem.cacheDirectory}everyhue-tryon-${stamp}.jpg`;
  await FileSystem.writeAsStringAsync(dest, bytesToBase64(asUint8(encoded.data)), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}
