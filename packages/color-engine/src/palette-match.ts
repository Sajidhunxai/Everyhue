import { converter } from "culori";
import type { PaletteMatch, PaletteSwatch } from "@photomatcher/types";

const toLab = converter("lab");

function hexToLab(hex: string) {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(raw)) return null;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const lab = toLab({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
  if (!lab) return null;
  return { L: lab.l, a: lab.a ?? 0, b: lab.b ?? 0 };
}

function deltaE76(
  a: { L: number; a: number; b: number },
  b: { L: number; a: number; b: number },
): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

function nearest(
  lab: { L: number; a: number; b: number },
  swatches: PaletteSwatch[],
): { swatch: PaletteSwatch; deltaE: number } | null {
  if (!swatches.length) return null;
  let best = swatches[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const swatch of swatches) {
    const other = hexToLab(swatch.hex);
    if (!other) continue;
    const dist = deltaE76(lab, other);
    if (dist < bestDist) {
      bestDist = dist;
      best = swatch;
    }
  }
  return { swatch: best, deltaE: bestDist };
}

export function scoreHexAgainstPalette(
  hex: string,
  palette: PaletteSwatch[],
  avoid: PaletteSwatch[] = [],
): PaletteMatch | null {
  const lab = hexToLab(hex);
  if (!lab || !palette.length) return null;
  const closest = nearest(lab, palette);
  if (!closest) return null;
  const avoidHit = nearest(lab, avoid);

  let score = Math.max(0, Math.min(100, Math.round(100 - closest.deltaE * 1.8)));
  let verdict: PaletteMatch["verdict"] = "poor";
  if (score >= 85) verdict = "excellent";
  else if (score >= 70) verdict = "good";
  else if (score >= 50) verdict = "fair";

  if (avoidHit && avoidHit.deltaE + 4 < closest.deltaE) {
    verdict = "avoid";
    score = Math.min(score, 35);
  }

  return {
    hex: `#${hex.replace(/^#/, "").toUpperCase()}`,
    score,
    verdict,
    deltaE: Number(closest.deltaE.toFixed(1)),
    closest: closest.swatch,
    nearestAvoid: avoidHit?.swatch ?? null,
  };
}

export function scoreLookAgainstPalette(
  hexes: string[],
  palette: PaletteSwatch[],
  avoid: PaletteSwatch[] = [],
): number | null {
  const scores = hexes
    .map((h) => scoreHexAgainstPalette(h, palette, avoid)?.score)
    .filter((n): n is number => typeof n === "number");
  if (!scores.length) return null;
  return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
}
