import { converter } from "culori";
import type { LabColor } from "@photomatcher/types";

const toLab = converter("lab");

function srgbToLab(r: number, g: number, b: number): LabColor {
  const lab = toLab({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
  if (!lab) {
    throw new Error("Failed to convert sRGB to Lab");
  }
  return { L: lab.l, a: lab.a ?? 0, b: lab.b ?? 0 };
}

export type PhotoValidationCode =
  | "no_pixels"
  | "too_uniform"
  | "too_dark"
  | "too_bright"
  | "not_human";

export type PhotoValidationResult = {
  ok: boolean;
  code?: PhotoValidationCode;
  message: string;
};

export type PhotoSampleStats = {
  centerRgb: { r: number; g: number; b: number };
  edgeRgb: { r: number; g: number; b: number };
  /** Standard deviation of pixel luminance (0–255 scale). */
  luminanceVariance: number;
  pixelCount: number;
};

export class PhotoValidationError extends Error {
  code: PhotoValidationCode;

  constructor(code: PhotoValidationCode, message: string) {
    super(message);
    this.name = "PhotoValidationError";
    this.code = code;
  }
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function avgRgb(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { r: number; g: number; b: number } {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const xs = Math.max(0, Math.min(x0, width - 1));
  const xe = Math.max(xs + 1, Math.min(x1, width));
  const ys = Math.max(0, Math.min(y0, height - 1));
  const ye = Math.max(ys + 1, Math.min(y1, height));

  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      const i = (y * width + x) * 4;
      if (i + 2 >= data.length) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }

  if (!n) return { r: 128, g: 128, b: 128 };
  return { r: r / n, g: g / n, b: b / n };
}

/** Build sampling stats from RGBA pixels (web canvas or decoded JPEG). */
export function statsFromRgbaGrid(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): PhotoSampleStats {
  const lums: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (i + 2 >= data.length) continue;
      lums.push(luminance(data[i], data[i + 1], data[i + 2]));
    }
  }

  const mean = lums.reduce((sum, v) => sum + v, 0) / Math.max(lums.length, 1);
  const variance = Math.sqrt(
    lums.reduce((sum, v) => sum + (v - mean) ** 2, 0) / Math.max(lums.length, 1),
  );

  const x0 = Math.floor(width * 0.3);
  const x1 = Math.floor(width * 0.7);
  const y0 = Math.floor(height * 0.34);
  const y1 = Math.floor(height * 0.66);
  const corner = Math.max(2, Math.floor(Math.min(width, height) * 0.12));

  const centerRgb = avgRgb(data, width, height, x0, y0, x1, y1);
  const corners = [
    avgRgb(data, width, height, 0, 0, corner, corner),
    avgRgb(data, width, height, width - corner, 0, width, corner),
    avgRgb(data, width, height, 0, height - corner, corner, height),
    avgRgb(data, width, height, width - corner, height - corner, width, height),
  ];
  const edgeRgb = {
    r: corners.reduce((s, c) => s + c.r, 0) / corners.length,
    g: corners.reduce((s, c) => s + c.g, 0) / corners.length,
    b: corners.reduce((s, c) => s + c.b, 0) / corners.length,
  };

  return {
    centerRgb,
    edgeRgb,
    luminanceVariance: variance,
    pixelCount: lums.length,
  };
}

function isObviousNonSkinRgb(r: number, g: number, b: number): boolean {
  if (b > r + 28 && b > g + 12) return true;
  if (g > r + 35 && g > b + 18) return true;
  if (r < 35 && g < 35 && b > 95) return true;
  if (r > 235 && g > 235 && b > 235) return true;
  if (r < 12 && g < 12 && b < 12) return true;
  return false;
}

function skinLikelihood(r: number, g: number, b: number): number {
  if (isObviousNonSkinRgb(r, g, b)) return 0;

  const lab = srgbToLab(r, g, b);
  const chroma = Math.hypot(lab.a, lab.b);

  if (lab.L < 14 || lab.L > 93) return 0;
  if (lab.a < -1) return 0;
  if (chroma < 2.5) return 0;
  if (chroma > 52) return 0;

  let score = 0.45;
  if (lab.a >= 1) score += 0.2;
  if (lab.L >= 22 && lab.L <= 85) score += 0.15;
  if (lab.b >= -8 && lab.b <= 48) score += 0.1;
  if (r >= g * 0.82 && r >= b * 0.75) score += 0.1;

  return Math.min(1, score);
}

export function validatePhotoForAnalysis(stats: PhotoSampleStats): PhotoValidationResult {
  if (stats.pixelCount < 16) {
    return {
      ok: false,
      code: "no_pixels",
      message: "We couldn't read that image. Try a JPG or PNG of your face.",
    };
  }

  if (stats.luminanceVariance < 4) {
    return {
      ok: false,
      code: "too_uniform",
      message:
        "This photo looks blank or single-color. Use a clear photo of a person in daylight.",
    };
  }

  const centerLab = srgbToLab(stats.centerRgb.r, stats.centerRgb.g, stats.centerRgb.b);

  if (centerLab.L < 16) {
    return {
      ok: false,
      code: "too_dark",
      message:
        "This photo is too dark. Use natural daylight, face the camera, and keep your face visible.",
    };
  }

  if (centerLab.L > 90 && stats.luminanceVariance < 18) {
    return {
      ok: false,
      code: "too_bright",
      message:
        "This photo looks overexposed or washed out. Avoid harsh flash or blown-out highlights on your face.",
    };
  }

  const centerSkin = skinLikelihood(stats.centerRgb.r, stats.centerRgb.g, stats.centerRgb.b);
  const edgeSkin = skinLikelihood(stats.edgeRgb.r, stats.edgeRgb.g, stats.edgeRgb.b);
  const lumDiff = Math.abs(
    luminance(stats.centerRgb.r, stats.centerRgb.g, stats.centerRgb.b) -
      luminance(stats.edgeRgb.r, stats.edgeRgb.g, stats.edgeRgb.b),
  );

  const portraitLike =
    (centerSkin >= 0.55 && lumDiff >= 4) ||
    (centerSkin >= 0.65 && centerSkin > edgeSkin + 0.08) ||
    centerSkin >= 0.75;

  if (!portraitLike) {
    return {
      ok: false,
      code: "not_human",
      message:
        "We couldn't detect a person in this photo. Use a human face photo with shoulders visible — not a landscape, object, or pet.",
    };
  }

  return { ok: true, message: "OK" };
}

export function assertValidPhoto(stats: PhotoSampleStats): void {
  const result = validatePhotoForAnalysis(stats);
  if (!result.ok && result.code) {
    throw new PhotoValidationError(result.code, result.message);
  }
}

/** Server-side guard when clients send precomputed Lab samples. */
export function validateLabSamplesForAnalysis(samples: LabColor[]): PhotoValidationResult {
  if (!samples.length) {
    return {
      ok: false,
      code: "no_pixels",
      message: "No color samples were provided. Upload a face photo and try again.",
    };
  }

  const avg = samples.reduce(
    (acc, s) => ({ L: acc.L + s.L, a: acc.a + s.a, b: acc.b + s.b }),
    { L: 0, a: 0, b: 0 },
  );
  const n = samples.length;
  const lab = { L: avg.L / n, a: avg.a / n, b: avg.b / n };
  const chroma = Math.hypot(lab.a, lab.b);

  if (lab.L < 14) {
    return {
      ok: false,
      code: "too_dark",
      message:
        "This photo is too dark for analysis. Use a brighter daylight photo with your face visible.",
    };
  }

  if (lab.L > 92 && chroma < 8) {
    return {
      ok: false,
      code: "too_bright",
      message: "This photo looks overexposed. Use softer daylight without washing out your skin.",
    };
  }

  if (lab.a < -1 || chroma < 2.5 || chroma > 55) {
    return {
      ok: false,
      code: "not_human",
      message:
        "These colors don't look like skin tones from a face photo. Please use a clear human portrait.",
    };
  }

  if (lab.a < 1 && lab.b < -12) {
    return {
      ok: false,
      code: "not_human",
      message:
        "We couldn't detect skin tones from a person. Use a human face photo in natural light.",
    };
  }

  return { ok: true, message: "OK" };
}
