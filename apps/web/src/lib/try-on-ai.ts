import type { TryOnFeature, TryOnLook } from "@photomatcher/types";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const SEGMENTER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";

const HAIR_CLASS = 1;
const FACE_SKIN_CLASS = 3;
const CLOTHES_CLASS = 4;
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const OUTER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];

export type TryOnMasks = {
  width: number;
  height: number;
  original: Uint8ClampedArray;
  hair: Float32Array<ArrayBufferLike>;
  lips: Float32Array<ArrayBufferLike>;
  eyes: Float32Array<ArrayBufferLike>;
  cheeks: Float32Array<ArrayBufferLike>;
  jewelry: Float32Array<ArrayBufferLike>;
  dress: Float32Array<ArrayBufferLike>;
};

export type StudioFeature = TryOnFeature;

export type TryOnStrength = Record<StudioFeature, number>;
export type TryOnEnabled = Record<StudioFeature, boolean>;

export const DEFAULT_STRENGTH: TryOnStrength = {
  hair: 0.84,
  eyes: 0.55,
  lips: 0.7,
  cheeks: 0.18,
  jewelry: 0.7,
  dress: 0.78,
};

export const DEFAULT_ENABLED: TryOnEnabled = {
  hair: true,
  eyes: true,
  lips: true,
  cheeks: true,
  jewelry: false,
  dress: false,
};

function isTfLiteNoise(args: unknown[]) {
  const text = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
  return /XNNPACK|TensorFlow Lite|Created TensorFlow|tflite/i.test(text);
}

function withQuietTfLite<T>(fn: () => T): T {
  const error = console.error;
  const warn = console.warn;
  const info = console.info;
  const log = console.log;
  const filter = (...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    error.apply(console, args as []);
  };
  console.error = filter as typeof console.error;
  console.warn = ((...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    warn.apply(console, args as []);
  }) as typeof console.warn;
  console.info = ((...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    info.apply(console, args as []);
  }) as typeof console.info;
  console.log = ((...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    log.apply(console, args as []);
  }) as typeof console.log;
  try {
    return fn();
  } finally {
    console.error = error;
    console.warn = warn;
    console.info = info;
    console.log = log;
  }
}

async function withQuietTfLiteAsync<T>(fn: () => Promise<T>): Promise<T> {
  const error = console.error;
  const warn = console.warn;
  const info = console.info;
  const log = console.log;
  const filter = (...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    error.apply(console, args as []);
  };
  console.error = filter as typeof console.error;
  console.warn = ((...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    warn.apply(console, args as []);
  }) as typeof console.warn;
  console.info = ((...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    info.apply(console, args as []);
  }) as typeof console.info;
  console.log = ((...args: unknown[]) => {
    if (isTfLiteNoise(args)) return;
    log.apply(console, args as []);
  }) as typeof console.log;
  try {
    return await fn();
  } finally {
    console.error = error;
    console.warn = warn;
    console.info = info;
    console.log = log;
  }
}

let segmenterPromise: Promise<import("@mediapipe/tasks-vision").ImageSegmenter> | null = null;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await withQuietTfLiteAsync(() => vision.FilesetResolver.forVisionTasks(WASM_CDN));
      return withQuietTfLiteAsync(() =>
        vision.ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: SEGMENTER_MODEL, delegate: "CPU" },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        }),
      );
    })();
  }
  return segmenterPromise;
}

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "");
  const n = parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
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
  const highlight = src.l > 0.72 ? 0.4 : 1;
  const a = Math.min(1, amount * highlight);
  const next = hslToRgb(tgt.h, Math.min(1, tgt.s * 0.95), src.l * 0.78 + tgt.l * 0.22);
  return {
    r: r + (next.r - r) * a,
    g: g + (next.g - g) * a,
    b: b + (next.b - b) * a,
  };
}

function colorizeSoft(r: number, g: number, b: number, tr: number, tg: number, tb: number, amount: number) {
  const src = rgbToHsl(r, g, b);
  const tgt = rgbToHsl(tr, tg, tb);
  const next = hslToRgb(tgt.h, Math.min(1, tgt.s * 0.8 + src.s * 0.2), src.l);
  return {
    r: r + (next.r - r) * amount,
    g: g + (next.g - g) * amount,
    b: b + (next.b - b) * amount,
  };
}

function putPixels(ctx: CanvasRenderingContext2D, pixels: Uint8ClampedArray, w: number, h: number) {
  const image = new ImageData(w, h);
  image.data.set(pixels);
  ctx.putImageData(image, 0, 0);
}

function emptyMask(n: number): Float32Array<ArrayBufferLike> {
  return new Float32Array(n);
}

function copyFloat(src: ArrayLike<number>): Float32Array<ArrayBufferLike> {
  const next = new Float32Array(src.length);
  next.set(src);
  return next;
}

function upsampleCategory(src: Uint8Array, sw: number, sh: number, dw: number, dh: number, cls: number) {
  const out = emptyMask(dw * dh);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / dh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / dw));
      if (src[sy * sw + sx] === cls) out[y * dw + x] = 1;
    }
  }
  return out;
}

function upsampleFloat(src: Float32Array, sw: number, sh: number, dw: number, dh: number) {
  const out = emptyMask(dw * dh);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / dh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / dw));
      out[y * dw + x] = src[sy * sw + sx];
    }
  }
  return out;
}

function blurMask(mask: Float32Array<ArrayBufferLike>, w: number, h: number, radius: number) {
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

function dilate(mask: Float32Array<ArrayBufferLike>, w: number, h: number, radius: number) {
  const out = emptyMask(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          best = Math.max(best, mask[yy * w + xx]);
        }
      }
      out[y * w + x] = best;
    }
  }
  return out;
}

export const NO_FACE_MESSAGE =
  "We couldn't find a person's face in that photo. Please upload a clear, front-facing photo of a person.";

export class NoFaceError extends Error {
  constructor(message = NO_FACE_MESSAGE) {
    super(message);
    this.name = "NoFaceError";
  }
}

function maskCoverage(mask: Float32Array, threshold: number) {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i] >= threshold) n++;
  return n / Math.max(1, mask.length);
}

function landmarkFaceOk(lm: { x: number; y: number }[]) {
  if (lm.length < 140) return false;
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of lm) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const bw = maxX - minX;
  const bh = maxY - minY;
  if (bw < 0.12 || bh < 0.16) return false;
  const area = bw * bh;
  const aspect = bw / bh;
  return area >= 0.04 && aspect > 0.45 && aspect < 1.85;
}

function segmentedFaceOk(faceSkin: Float32Array, w: number, h: number) {
  const coverage = maskCoverage(faceSkin, 0.4);
  if (coverage < 0.03 || coverage > 0.62) return false;
  const box = faceBox(faceSkin, w, h);
  if (!box) return false;
  const area = (box.bw * box.bh) / (w * h);
  const aspect = box.bw / box.bh;
  return area >= 0.05 && aspect > 0.5 && aspect < 1.75;
}

function detectLandmarks(
  landmarker: import("@mediapipe/tasks-vision").FaceLandmarker,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
) {
  const faces = withQuietTfLite(() => {
    try {
      return landmarker.detect(canvas);
    } catch {
      try {
        return landmarker.detect(image);
      } catch {
        return { faceLandmarks: [] as { x: number; y: number }[][] };
      }
    }
  });
  return faces.faceLandmarks[0] ?? null;
}

function faceBox(faceSkin: Float32Array, w: number, h: number) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (faceSkin[y * w + x] < 0.4) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) return null;
  return { minX, minY, maxX, maxY, bw: maxX - minX, bh: maxY - minY };
}

function addHairHelmet(
  hair: Float32Array<ArrayBufferLike>,
  faceSkin: Float32Array<ArrayBufferLike>,
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
) {
  const box = faceBox(faceSkin, w, h);
  if (!box) return hair;
  const { minX, minY, maxX, bw, bh } = box;
  const y0 = Math.max(0, Math.floor(minY - bh * 0.95));
  const y1 = Math.min(h - 1, Math.floor(minY + bh * 0.28));
  const x0 = Math.max(0, Math.floor(minX - bw * 0.22));
  const x1 = Math.min(w - 1, Math.floor(maxX + bw * 0.22));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (faceSkin[i] > 0.45) continue;
      const p = i * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      if (g > r * 1.18 && g > b * 0.9) continue;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum > 0.62) continue;
      hair[i] = Math.max(hair[i], 0.72);
    }
  }
  return hair;
}

function fillEllipse(mask: Float32Array, w: number, h: number, cx: number, cy: number, rx: number, ry: number, value = 1) {
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

function makeupFromFace(faceSkin: Float32Array, w: number, h: number) {
  const lips = emptyMask(w * h);
  const eyes = emptyMask(w * h);
  const cheeks = emptyMask(w * h);
  const jewelry = emptyMask(w * h);
  const box = faceBox(faceSkin, w, h);
  if (!box) return { lips, eyes, cheeks, jewelry };
  const { minX, minY, maxX, bw, bh } = box;
  const cx = (minX + bw / 2) / w;
  fillEllipse(lips, w, h, cx, (minY + bh * 0.78) / h, (bw * 0.16) / w, (bh * 0.045) / h, 1);
  fillEllipse(eyes, w, h, (minX + bw * 0.35) / w, (minY + bh * 0.38) / h, (bw * 0.035) / w, (bh * 0.022) / h, 1);
  fillEllipse(eyes, w, h, (minX + bw * 0.65) / w, (minY + bh * 0.38) / h, (bw * 0.035) / w, (bh * 0.022) / h, 1);
  fillEllipse(cheeks, w, h, (minX + bw * 0.28) / w, (minY + bh * 0.56) / h, (bw * 0.1) / w, (bh * 0.075) / h, 0.85);
  fillEllipse(cheeks, w, h, (minX + bw * 0.72) / w, (minY + bh * 0.56) / h, (bw * 0.1) / w, (bh * 0.075) / h, 0.85);
  fillEllipse(jewelry, w, h, (minX - bw * 0.04) / w, (minY + bh * 0.55) / h, (bw * 0.035) / w, (bh * 0.06) / h, 0.9);
  fillEllipse(jewelry, w, h, (maxX + bw * 0.04) / w, (minY + bh * 0.55) / h, (bw * 0.035) / w, (bh * 0.06) / h, 0.9);
  fillEllipse(jewelry, w, h, cx, (minY + bh * 1.08) / h, (bw * 0.12) / w, (bh * 0.035) / h, 0.7);
  for (let i = 0; i < cheeks.length; i++) cheeks[i] *= faceSkin[i] > 0.2 ? faceSkin[i] : 0;
  return {
    lips: blurMask(lips, w, h, 2),
    eyes: blurMask(eyes, w, h, 1),
    cheeks: blurMask(cheeks, w, h, 3),
    jewelry: blurMask(jewelry, w, h, 2),
  };
}

type Landmark = { x: number; y: number };

function fillPolygon(mask: Float32Array, w: number, h: number, points: Landmark[], value: number) {
  if (points.length < 3) return;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  const px = points.map((p) => p.x * w);
  const py = points.map((p) => p.y * h);
  for (let i = 0; i < px.length; i++) {
    minX = Math.min(minX, px[i]);
    minY = Math.min(minY, py[i]);
    maxX = Math.max(maxX, px[i]);
    maxY = Math.max(maxY, py[i]);
  }
  const x0 = Math.max(0, Math.floor(minX));
  const x1 = Math.min(w - 1, Math.ceil(maxX));
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(h - 1, Math.ceil(maxY));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let inside = false;
      for (let i = 0, j = px.length - 1; i < px.length; j = i++) {
        const yi = py[i];
        const yj = py[j];
        const xi = px[i];
        const xj = px[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi) inside = !inside;
      }
      if (inside) mask[y * w + x] = Math.max(mask[y * w + x], value);
    }
  }
}

function landmarkPts(lm: Landmark[], ids: number[]) {
  return ids.map((id) => lm[id]).filter((p): p is Landmark => Boolean(p));
}

function applyFaceLandmarks(lm: Landmark[], w: number, h: number, faceSkin: Float32Array) {
  const lips = emptyMask(w * h);
  const eyes = emptyMask(w * h);
  const cheeks = emptyMask(w * h);
  const jewelry = emptyMask(w * h);
  fillPolygon(lips, w, h, landmarkPts(lm, OUTER_LIP), 1);
  const leftIris = landmarkPts(lm, LEFT_IRIS);
  const rightIris = landmarkPts(lm, RIGHT_IRIS);
  const leftEye = leftIris.length
    ? leftIris
    : [lm[33], lm[133]].filter((p): p is Landmark => Boolean(p));
  const rightEye = rightIris.length
    ? rightIris
    : [lm[263], lm[362]].filter((p): p is Landmark => Boolean(p));
  if (leftEye.length) {
    const cx = leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length;
    const cy = leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length;
    fillEllipse(eyes, w, h, cx, cy, 0.012, 0.01, 1);
  }
  if (rightEye.length) {
    const cx = rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length;
    const cy = rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length;
    fillEllipse(eyes, w, h, cx, cy, 0.012, 0.01, 1);
  }
  const leftCheek = lm[50] ?? lm[187];
  const rightCheek = lm[280] ?? lm[411];
  if (leftCheek) fillEllipse(cheeks, w, h, leftCheek.x, leftCheek.y, 0.045, 0.038, 0.9);
  if (rightCheek) fillEllipse(cheeks, w, h, rightCheek.x, rightCheek.y, 0.045, 0.038, 0.9);
  const leftEar = lm[234] ?? lm[132];
  const rightEar = lm[454] ?? lm[361];
  const chin = lm[152];
  if (leftEar) fillEllipse(jewelry, w, h, leftEar.x, leftEar.y + 0.02, 0.018, 0.028, 0.95);
  if (rightEar) fillEllipse(jewelry, w, h, rightEar.x, rightEar.y + 0.02, 0.018, 0.028, 0.95);
  if (chin) fillEllipse(jewelry, w, h, chin.x, chin.y + 0.06, 0.07, 0.022, 0.75);
  for (let i = 0; i < cheeks.length; i++) cheeks[i] *= faceSkin[i] > 0.15 ? Math.min(1, faceSkin[i] + 0.2) : 0;
  return {
    lips: blurMask(lips, w, h, 1),
    eyes: blurMask(eyes, w, h, 1),
    cheeks: blurMask(cheeks, w, h, 3),
    jewelry: blurMask(jewelry, w, h, 2),
  };
}

let landmarkerPromise: Promise<import("@mediapipe/tasks-vision").FaceLandmarker | null> | null = null;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await withQuietTfLiteAsync(() => vision.FilesetResolver.forVisionTasks(WASM_CDN));
        return await withQuietTfLiteAsync(() =>
          vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
            runningMode: "IMAGE",
            numFaces: 1,
          }),
        );
      } catch {
        return null;
      }
    })();
  }
  return landmarkerPromise;
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

export function cloneMasks(masks: TryOnMasks): TryOnMasks {
  return {
    width: masks.width,
    height: masks.height,
    original: masks.original,
    hair: copyFloat(masks.hair),
    lips: copyFloat(masks.lips),
    eyes: copyFloat(masks.eyes),
    cheeks: copyFloat(masks.cheeks),
    jewelry: copyFloat(masks.jewelry),
    dress: copyFloat(masks.dress),
  };
}

export function copyLayer(masks: TryOnMasks, feature: StudioFeature) {
  return copyFloat(masks[feature]);
}

export function restoreLayer(masks: TryOnMasks, feature: StudioFeature, layer: Float32Array<ArrayBufferLike>): TryOnMasks {
  const next = cloneMasks(masks);
  next[feature] = copyFloat(layer);
  return next;
}

export function stampMaskInPlace(
  masks: TryOnMasks,
  feature: StudioFeature,
  x: number,
  y: number,
  radius: number,
  mode: "paint" | "erase",
  hardness = 0.55,
) {
  const layer = masks[feature];
  const { width: w, height: h } = masks;
  const r = Math.max(2, radius);
  const hard = Math.min(0.95, Math.max(0.05, hardness));
  const core = hard;
  const x0 = Math.max(0, Math.floor(x - r));
  const x1 = Math.min(w - 1, Math.ceil(x + r));
  const y0 = Math.max(0, Math.floor(y - r));
  const y1 = Math.min(h - 1, Math.ceil(y + r));
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = (px - x) / r;
      const dy = (py - y) / r;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const falloff = d <= core ? 1 : 1 - (d - core) / (1 - core);
      const i = py * w + px;
      if (mode === "erase") layer[i] *= 1 - falloff;
      else layer[i] = Math.max(layer[i], falloff);
    }
  }
}

export function stampStrokeInPlace(
  masks: TryOnMasks,
  feature: StudioFeature,
  from: { x: number; y: number } | null,
  to: { x: number; y: number },
  radius: number,
  mode: "paint" | "erase",
  hardness = 0.55,
) {
  if (!from) {
    stampMaskInPlace(masks, feature, to.x, to.y, radius, mode, hardness);
    return;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.max(1, radius * 0.32);
  const n = Math.max(1, Math.ceil(dist / step));
  for (let i = 1; i <= n; i++) {
    stampMaskInPlace(masks, feature, from.x + (dx * i) / n, from.y + (dy * i) / n, radius, mode, hardness);
  }
}

export function stampMask(
  masks: TryOnMasks,
  feature: StudioFeature,
  x: number,
  y: number,
  radius: number,
  mode: "paint" | "erase",
  hardness = 0.55,
): TryOnMasks {
  const next = cloneMasks(masks);
  stampMaskInPlace(next, feature, x, y, radius, mode, hardness);
  return next;
}

export async function fileToImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 960;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const image = new Image();
  const url = canvas.toDataURL("image/jpeg", 0.9);
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load photo"));
    image.src = url;
  });
  return { image, canvas, ctx };
}

export async function buildTryOnMasks(image: HTMLImageElement, canvas: HTMLCanvasElement): Promise<TryOnMasks> {
  const segmenter = await getSegmenter();
  const w = canvas.width;
  const h = canvas.height;
  const original = canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, w, h).data;

  let hair: Float32Array<ArrayBufferLike> = emptyMask(w * h);
  let faceSkin: Float32Array<ArrayBufferLike> = emptyMask(w * h);
  let dress: Float32Array<ArrayBufferLike> = emptyMask(w * h);

  const seg = withQuietTfLite(() => {
    try {
      return segmenter.segment(canvas);
    } catch {
      return segmenter.segment(image);
    }
  });
  const cat = seg.categoryMask;
  if (cat) {
    const raw = cat.hasUint8Array()
      ? Uint8Array.from(cat.getAsUint8Array())
      : (() => {
          const f = cat.getAsFloat32Array();
          const data = new Uint8Array(cat.width * cat.height);
          for (let i = 0; i < data.length; i++) data[i] = Math.round(f[i]);
          return data;
        })();
    hair = upsampleCategory(raw, cat.width, cat.height, w, h, HAIR_CLASS);
    faceSkin = upsampleCategory(raw, cat.width, cat.height, w, h, FACE_SKIN_CLASS);
    dress = upsampleCategory(raw, cat.width, cat.height, w, h, CLOTHES_CLASS);
    cat.close();
  }
  const hairConf = seg.confidenceMasks?.[HAIR_CLASS];
  if (hairConf) {
    const conf = hairConf.hasFloat32Array()
      ? Float32Array.from(hairConf.getAsFloat32Array())
      : (() => {
          const u = hairConf.getAsUint8Array();
          const f = new Float32Array(u.length);
          for (let i = 0; i < u.length; i++) f[i] = u[i] / 255;
          return f;
        })();
    const up = upsampleFloat(conf, hairConf.width, hairConf.height, w, h);
    for (let i = 0; i < hair.length; i++) hair[i] = Math.max(hair[i], up[i]);
    hairConf.close();
  }

  const landmarker = await getLandmarker();
  const lm = landmarker ? detectLandmarks(landmarker, canvas, image) : null;
  const foundFace = landmarker ? Boolean(lm && landmarkFaceOk(lm)) : segmentedFaceOk(faceSkin, w, h);
  if (!foundFace) throw new NoFaceError();

  hair = addHairHelmet(hair, faceSkin, original, w, h);
  hair = dilate(hair, w, h, 2);
  hair = blurMask(hair, w, h, 2);
  faceSkin = blurMask(faceSkin, w, h, 2);
  for (let i = 0; i < dress.length; i++) {
    if (hair[i] > 0.35 || faceSkin[i] > 0.45) dress[i] = 0;
  }
  dress = blurMask(dress, w, h, 2);

  let makeup = makeupFromFace(faceSkin, w, h);
  if (lm && lm.length >= 140) makeup = applyFaceLandmarks(lm, w, h, faceSkin);

  return {
    width: w,
    height: h,
    original: Uint8ClampedArray.from(original),
    hair: copyFloat(hair),
    lips: copyFloat(makeup.lips),
    eyes: copyFloat(makeup.eyes),
    cheeks: copyFloat(makeup.cheeks),
    jewelry: copyFloat(makeup.jewelry),
    dress: copyFloat(dress),
  };
}

export function renderTryOn(
  ctx: CanvasRenderingContext2D,
  masks: TryOnMasks,
  look: TryOnLook,
  strength: TryOnStrength,
  enabled: TryOnEnabled = DEFAULT_ENABLED,
) {
  const { width: w, height: h, original } = masks;
  const out = new Uint8ClampedArray(original);
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

    const hairA = enabled.hair ? masks.hair[i] * strength.hair : 0;
    if (hairA > 0.04) {
      const c = colorizeHair(r, g, b, hair.r, hair.g, hair.b, hairA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const dressA = enabled.dress ? masks.dress[i] * strength.dress : 0;
    if (dressA > 0.05) {
      const c = colorizeHair(r, g, b, dress.r, dress.g, dress.b, dressA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const cheekA = enabled.cheeks ? masks.cheeks[i] * strength.cheeks : 0;
    if (cheekA > 0.03) {
      r = r + (cheeks.r - r) * cheekA * 0.28;
      g = g + (cheeks.g - g) * cheekA * 0.22;
      b = b + (cheeks.b - b) * cheekA * 0.2;
    }
    const lipA = enabled.lips ? masks.lips[i] * strength.lips : 0;
    if (lipA > 0.04) {
      const c = colorizeSoft(r, g, b, lips.r, lips.g, lips.b, lipA);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const eyeA = enabled.eyes ? masks.eyes[i] * strength.eyes : 0;
    if (eyeA > 0.05 && lum > 0.12 && lum < 0.82) {
      const c = colorizeSoft(r, g, b, eyes.r, eyes.g, eyes.b, eyeA * 0.85);
      r = c.r;
      g = c.g;
      b = c.b;
    }
    const jewelA = enabled.jewelry ? masks.jewelry[i] * strength.jewelry : 0;
    if (jewelA > 0.05) {
      const c = colorizeMetal(r, g, b, jewelry.r, jewelry.g, jewelry.b, jewelA);
      r = c.r;
      g = c.g;
      b = c.b;
    }

    out[p] = Math.max(0, Math.min(255, r));
    out[p + 1] = Math.max(0, Math.min(255, g));
    out[p + 2] = Math.max(0, Math.min(255, b));
  }

  putPixels(ctx, out, w, h);
}

export function drawOriginal(ctx: CanvasRenderingContext2D, masks: TryOnMasks) {
  putPixels(ctx, masks.original, masks.width, masks.height);
}
