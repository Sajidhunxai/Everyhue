import { converter, formatHex } from "culori";
import type { LabColor, PaletteSwatch, SeasonId, StyleGuide } from "@photomatcher/types";
import type { BodyType, FaceShape } from "@photomatcher/types";
import { getFaceBodyTips, seasonFaceBodyNote } from "./face-body";
import { STYLE_GUIDES } from "./style-guides";

export const ENGINE_VERSION = "0.2.0";

const toLab = converter("lab");
const toRgb = converter("rgb");

export function srgbToLab(r: number, g: number, b: number): LabColor {
  const lab = toLab({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
  if (!lab) {
    throw new Error("Failed to convert sRGB to Lab");
  }
  return { L: lab.l, a: lab.a ?? 0, b: lab.b ?? 0 };
}

export function labToHex(lab: LabColor): string {
  const rgb = toRgb({ mode: "lab", l: lab.L, a: lab.a, b: lab.b });
  if (!rgb) return "#000000";
  return formatHex(rgb);
}

function averageLab(samples: LabColor[]): LabColor {
  if (samples.length === 0) {
    throw new Error("At least one Lab sample is required");
  }
  const n = samples.length;
  return {
    L: samples.reduce((s, c) => s + c.L, 0) / n,
    a: samples.reduce((s, c) => s + c.a, 0) / n,
    b: samples.reduce((s, c) => s + c.b, 0) / n,
  };
}

function deltaE76(a: LabColor, b: LabColor): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/** Original PhotoMatcher 12-season centroids (Lab) — invented for this product. */
export const SEASON_CENTROIDS: Record<
  SeasonId,
  { label: string; lab: LabColor; undertone: "warm" | "cool" | "neutral" }
> = {
  bright_spring: {
    label: "Bright Spring",
    lab: { L: 68, a: 18, b: 28 },
    undertone: "warm",
  },
  true_spring: {
    label: "True Spring",
    lab: { L: 64, a: 16, b: 32 },
    undertone: "warm",
  },
  light_spring: {
    label: "Light Spring",
    lab: { L: 74, a: 10, b: 22 },
    undertone: "warm",
  },
  light_summer: {
    label: "Light Summer",
    lab: { L: 72, a: 8, b: 6 },
    undertone: "cool",
  },
  true_summer: {
    label: "True Summer",
    lab: { L: 62, a: 10, b: 2 },
    undertone: "cool",
  },
  soft_summer: {
    label: "Soft Summer",
    lab: { L: 58, a: 6, b: 4 },
    undertone: "cool",
  },
  soft_autumn: {
    label: "Soft Autumn",
    lab: { L: 56, a: 12, b: 18 },
    undertone: "warm",
  },
  true_autumn: {
    label: "True Autumn",
    lab: { L: 52, a: 18, b: 30 },
    undertone: "warm",
  },
  deep_autumn: {
    label: "Deep Autumn",
    lab: { L: 42, a: 16, b: 22 },
    undertone: "warm",
  },
  deep_winter: {
    label: "Deep Winter",
    lab: { L: 38, a: 14, b: 2 },
    undertone: "cool",
  },
  true_winter: {
    label: "True Winter",
    lab: { L: 48, a: 16, b: -4 },
    undertone: "cool",
  },
  bright_winter: {
    label: "Bright Winter",
    lab: { L: 58, a: 22, b: 4 },
    undertone: "cool",
  },
};

/** Original palette hexes per season — not sourced from any third-party palette product. */
const PALETTES: Record<SeasonId, { palette: PaletteSwatch[]; avoid: PaletteSwatch[] }> = {
  bright_spring: {
    palette: [
      { hex: "#FF6B3D", name: "Coral Flame" },
      { hex: "#FFD166", name: "Sunbeam" },
      { hex: "#06D6A0", name: "Mint Pop" },
      { hex: "#118AB2", name: "Clear Aqua" },
      { hex: "#EF476F", name: "Rose Punch" },
    ],
    avoid: [
      { hex: "#4A3728", name: "Muddy Brown" },
      { hex: "#6B6B6B", name: "Dusty Grey" },
    ],
  },
  true_spring: {
    palette: [
      { hex: "#E85D04", name: "Warm Mandarin" },
      { hex: "#F4A261", name: "Honey Peach" },
      { hex: "#2A9D8F", name: "Teal Leaf" },
      { hex: "#E9C46A", name: "Golden Field" },
      { hex: "#264653", name: "Deep Bay" },
    ],
    avoid: [
      { hex: "#5C4B7A", name: "Muted Plum" },
      { hex: "#9E9E9E", name: "Flat Grey" },
    ],
  },
  light_spring: {
    palette: [
      { hex: "#FFB4A2", name: "Soft Apricot" },
      { hex: "#E9C46A", name: "Butter" },
      { hex: "#A8DADC", name: "Pale Sea" },
      { hex: "#F1FAEE", name: "Ivory Mist" },
      { hex: "#457B9D", name: "Sky Soft" },
    ],
    avoid: [
      { hex: "#1D1D1D", name: "Harsh Black" },
      { hex: "#7B2D26", name: "Heavy Burgundy" },
    ],
  },
  light_summer: {
    palette: [
      { hex: "#B8C0FF", name: "Lavender Mist" },
      { hex: "#CDB4DB", name: "Lilac" },
      { hex: "#A2D2FF", name: "Powder Blue" },
      { hex: "#FFC8DD", name: "Blush" },
      { hex: "#8E9AAF", name: "Cool Slate" },
    ],
    avoid: [
      { hex: "#FF6B00", name: "Neon Orange" },
      { hex: "#3D2914", name: "Earthy Brown" },
    ],
  },
  true_summer: {
    palette: [
      { hex: "#7B9ACC", name: "Classic Blue" },
      { hex: "#C77DFF", name: "Soft Violet" },
      { hex: "#90E0EF", name: "Icy Teal" },
      { hex: "#F72585", name: "Raspberry" },
      { hex: "#4A4E69", name: "Storm" },
    ],
    avoid: [
      { hex: "#D4A373", name: "Camel" },
      { hex: "#BC6C25", name: "Rust" },
    ],
  },
  soft_summer: {
    palette: [
      { hex: "#9A8C98", name: "Dove Mauve" },
      { hex: "#C9ADA7", name: "Rose Stone" },
      { hex: "#4A6FA5", name: "Muted Denim" },
      { hex: "#E0B1CB", name: "Dusty Rose" },
      { hex: "#22223B", name: "Soft Ink" },
    ],
    avoid: [
      { hex: "#00FF9F", name: "Neon Mint" },
      { hex: "#FF0000", name: "Pure Red" },
    ],
  },
  soft_autumn: {
    palette: [
      { hex: "#BC6C25", name: "Clay" },
      { hex: "#DDA15E", name: "Sandstone" },
      { hex: "#606C38", name: "Olive Soft" },
      { hex: "#A98467", name: "Taupe" },
      { hex: "#6F1D1B", name: "Muted Wine" },
    ],
    avoid: [
      { hex: "#00E5FF", name: "Icy Cyan" },
      { hex: "#FFFFFF", name: "Stark White" },
    ],
  },
  true_autumn: {
    palette: [
      { hex: "#9C2F2F", name: "Brick" },
      { hex: "#C36A2D", name: "Pumpkin" },
      { hex: "#6B4226", name: "Chestnut" },
      { hex: "#3F6212", name: "Moss" },
      { hex: "#CA8A04", name: "Harvest Gold" },
    ],
    avoid: [
      { hex: "#7C3AED", name: "Electric Purple" },
      { hex: "#E0E7FF", name: "Ice Blue" },
    ],
  },
  deep_autumn: {
    palette: [
      { hex: "#3F1F0F", name: "Espresso" },
      { hex: "#7F1D1D", name: "Deep Wine" },
      { hex: "#365314", name: "Forest" },
      { hex: "#92400E", name: "Burnt Amber" },
      { hex: "#1C1917", name: "Near Black Warm" },
    ],
    avoid: [
      { hex: "#FBCFE8", name: "Pastel Pink" },
      { hex: "#A5F3FC", name: "Pale Cyan" },
    ],
  },
  deep_winter: {
    palette: [
      { hex: "#0F172A", name: "Midnight" },
      { hex: "#7F1D1D", name: "Garnet" },
      { hex: "#1E3A5F", name: "Navy Deep" },
      { hex: "#4C1D95", name: "Royal Plum" },
      { hex: "#F8FAFC", name: "Snow" },
    ],
    avoid: [
      { hex: "#F59E0B", name: "Mustard" },
      { hex: "#A3E635", name: "Lime" },
    ],
  },
  true_winter: {
    palette: [
      { hex: "#111827", name: "Charcoal" },
      { hex: "#BE123C", name: "True Crimson" },
      { hex: "#1D4ED8", name: "Royal Blue" },
      { hex: "#6D28D9", name: "Jewel Violet" },
      { hex: "#F9FAFB", name: "Optic White" },
    ],
    avoid: [
      { hex: "#D97706", name: "Amber" },
      { hex: "#78716C", name: "Warm Grey" },
    ],
  },
  bright_winter: {
    palette: [
      { hex: "#E11D48", name: "Hot Rose" },
      { hex: "#2563EB", name: "Electric Blue" },
      { hex: "#7C3AED", name: "Vivid Violet" },
      { hex: "#059669", name: "Emerald" },
      { hex: "#F8FAFC", name: "Ice White" },
    ],
    avoid: [
      { hex: "#92400E", name: "Rusty Brown" },
      { hex: "#A8A29E", name: "Warm Stone" },
    ],
  },
};

const TIPS: Record<SeasonId, string[]> = {
  bright_spring: [
    "Choose clear, vivid hues over muted tones.",
    "Warm metals like gold usually flatter this profile.",
  ],
  true_spring: [
    "Lean into warm clear colors; avoid dusty finishes.",
    "Ivory and warm off-whites beat stark cool white.",
  ],
  light_spring: [
    "Keep contrast gentle; light clear colors read best.",
    "Soft peach and warm pastels support your coloring.",
  ],
  light_summer: [
    "Cool soft pastels and low-contrast outfits work well.",
    "Silver and cool rose gold tend to suit better than yellow gold.",
  ],
  true_summer: [
    "Cool medium-value colors with soft edges are your allies.",
    "Avoid neon or very orange-leaning warm tones.",
  ],
  soft_summer: [
    "Muted cool shades keep harmony with your softness.",
    "Blend rather than high-contrast black-and-white looks.",
  ],
  soft_autumn: [
    "Earthy muted warms and soft olives feel natural.",
    "Skip icy pastels and high-chroma cool brights.",
  ],
  true_autumn: [
    "Rich warm earth tones and golden accents shine.",
    "Cool blue-pinks and stark black can look harsh.",
  ],
  deep_autumn: [
    "Deep warm colors and dense textures add polish.",
    "Very light icy colors can wash out depth.",
  ],
  deep_winter: [
    "High-contrast cool deep colors create clarity.",
    "Warm dusty oranges usually fight this profile.",
  ],
  true_winter: [
    "Clear cool jewel tones and crisp contrast work best.",
    "Prefer true black and optic white over beige.",
  ],
  bright_winter: [
    "High-chroma cool colors keep energy and clarity.",
    "Avoid muted warm earth tones that dull contrast.",
  ],
};

export type MatchSeasonResult = {
  engine_version: string;
  seasonId: SeasonId;
  seasonLabel: string;
  confidence: number;
  undertone: "warm" | "cool" | "neutral";
  palette: PaletteSwatch[];
  avoid: PaletteSwatch[];
  tips: string[];
  styleGuide: StyleGuide;
  faceBodyTips?: ReturnType<typeof getFaceBodyTips>;
  averageLab: LabColor;
};

export type MatchSeasonOptions = {
  faceShape?: FaceShape;
  bodyType?: BodyType;
};

export function matchSeason(
  samples: LabColor[],
  options?: MatchSeasonOptions,
): MatchSeasonResult {
  const avg = averageLab(samples);
  let bestId: SeasonId = "true_summer";
  let bestDist = Number.POSITIVE_INFINITY;

  (Object.keys(SEASON_CENTROIDS) as SeasonId[]).forEach((id) => {
    const dist = deltaE76(avg, SEASON_CENTROIDS[id].lab);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  });

  // Map distance to a soft confidence (closer = higher). Caps for UX.
  const confidence = Math.max(0.35, Math.min(0.98, 1 - bestDist / 80));
  const meta = SEASON_CENTROIDS[bestId];
  const colors = PALETTES[bestId];
  const faceBodyTips =
    options?.faceShape && options?.bodyType
      ? getFaceBodyTips(options.faceShape, options.bodyType)
      : undefined;
  const extraTips = [...TIPS[bestId]];
  if (faceBodyTips) {
    extraTips.push(seasonFaceBodyNote(bestId, options!.faceShape!));
  }

  return {
    engine_version: ENGINE_VERSION,
    seasonId: bestId,
    seasonLabel: meta.label,
    confidence: Number(confidence.toFixed(3)),
    undertone: meta.undertone,
    palette: colors.palette,
    avoid: colors.avoid,
    tips: extraTips,
    styleGuide: STYLE_GUIDES[bestId],
    faceBodyTips,
    averageLab: avg,
  };
}

export { comparePhotos } from "./compare";
export { shopForSeason, shopCategories, shopByHex, allShopItems } from "./shop";
export { scoreHexAgainstPalette, scoreLookAgainstPalette } from "./palette-match";
export { buildTryOnCatalog } from "./try-on";
export { getFaceBodyTips, seasonFaceBodyNote } from "./face-body";
export { RESULT_IMAGES, seasonFamily, seasonStory } from "./season-story";
export type { SeasonFamily } from "./season-story";
export { stylistReply, stylistReplyWithAi } from "./stylist-chat";
export {
  STYLE_QUIZ_QUESTIONS,
  buildStyleQuizResult,
  emptyStyleQuizAnswers,
  isStyleQuizComplete,
} from "./style-quiz";
export {
  PhotoValidationError,
  assertValidPhoto,
  statsFromRgbaGrid,
  validateLabSamplesForAnalysis,
  validatePhotoForAnalysis,
} from "./photo-validation";
export type {
  PhotoSampleStats,
  PhotoValidationCode,
  PhotoValidationResult,
} from "./photo-validation";

/** Stub skin sampling: average center region RGB → Lab. Replace with MediaPipe later. */
export function stubSamplesFromAverageRgb(
  r: number,
  g: number,
  b: number,
): LabColor[] {
  const base = srgbToLab(r, g, b);
  return [
    base,
    { L: base.L + 1.5, a: base.a, b: base.b },
    { L: base.L - 1.5, a: base.a * 0.98, b: base.b * 0.98 },
  ];
}
