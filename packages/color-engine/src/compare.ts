import type { ComparePhotoInput, CompareResult, LabColor } from "@photomatcher/types";

function avgLab(samples: LabColor[]): LabColor {
  const n = samples.length || 1;
  return {
    L: samples.reduce((s, c) => s + c.L, 0) / n,
    a: samples.reduce((s, c) => s + c.a, 0) / n,
    b: samples.reduce((s, c) => s + c.b, 0) / n,
  };
}

function undertoneHint(lab: LabColor): string {
  if (lab.b > 12 && lab.a > 8) return "Warm-leaning sample";
  if (lab.b < 4 && lab.a > 6) return "Cool-leaning sample";
  if (lab.a < 4) return "Neutral-leaning sample";
  return "Mixed undertone — check lighting";
}

function brightnessLabel(L: number): string {
  if (L > 70) return "Very bright — good if natural daylight";
  if (L > 55) return "Balanced brightness";
  if (L > 40) return "Slightly dim — move closer to window";
  return "Too dark — retake in daylight";
}

function deltaE(a: LabColor, b: LabColor): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

function sampleVariance(samples: LabColor[]): number {
  if (samples.length < 2) return 0;
  const mean = avgLab(samples);
  return (
    samples.reduce((s, c) => s + deltaE(c, mean) ** 2, 0) / samples.length
  );
}

export function comparePhotos(a: ComparePhotoInput, b: ComparePhotoInput): CompareResult {
  const labA = avgLab(a.samples);
  const labB = avgLab(b.samples);
  const varA = sampleVariance(a.samples);
  const varB = sampleVariance(b.samples);

  const lightingScoreA = Math.max(0, 100 - Math.abs(labA.L - 62) * 2 - varA);
  const lightingScoreB = Math.max(0, 100 - Math.abs(labB.L - 62) * 2 - varB);
  const lightingScore = Math.round((lightingScoreA + lightingScoreB) / 2);

  const consistency = Math.max(0, 100 - deltaE(labA, labB) * 1.2);
  const consistencyScore = Math.round(consistency);

  let betterPhoto: CompareResult["betterPhoto"] = "tie";
  if (lightingScoreA > lightingScoreB + 8) betterPhoto = "A";
  else if (lightingScoreB > lightingScoreA + 8) betterPhoto = "B";

  let recommendation =
    "Both photos are usable. Prefer the one with even daylight on the face.";
  if (betterPhoto === "A") {
    recommendation = `Use "${a.label}" for analysis — better lighting and skin sampling.`;
  } else if (betterPhoto === "B") {
    recommendation = `Use "${b.label}" for analysis — better lighting and skin sampling.`;
  }
  if (consistencyScore < 55) {
    recommendation +=
      " Large difference detected — lighting or white balance changed between shots.";
  }

  return {
    lightingScore,
    consistencyScore,
    recommendation,
    photoA: {
      label: a.label,
      undertoneHint: undertoneHint(labA),
      brightness: brightnessLabel(labA.L),
    },
    photoB: {
      label: b.label,
      undertoneHint: undertoneHint(labB),
      brightness: brightnessLabel(labB.L),
    },
    betterPhoto,
  };
}
