import type { AnalyzeResult, TryOnCatalog, TryOnFeature, TryOnLook, TryOnSwatch } from "@photomatcher/types";

const HAIR_HEX: [string, string][] = [
  ["golden blonde", "#E0C070"],
  ["honey blonde", "#C9A44C"],
  ["strawberry", "#C9845A"],
  ["ash blonde", "#C5B89A"],
  ["platinum", "#E8E2D4"],
  ["caramel", "#A56B3A"],
  ["copper", "#B85C38"],
  ["auburn", "#8B3A2A"],
  ["chestnut", "#6B3A2A"],
  ["warm brown", "#5C3A28"],
  ["light warm brown", "#8A5A3A"],
  ["cool light brown", "#7A6558"],
  ["cool dark brown", "#3A2A24"],
  ["mushroom", "#6B5A50"],
  ["espresso", "#2A1C16"],
  ["jet black", "#141414"],
  ["blue-black", "#12141C"],
  ["cool black", "#1A1A1E"],
  ["burgundy", "#5C1C2A"],
  ["ash", "#9A8B78"],
];

const LIP_HEX: [string, string][] = [
  ["peach nude", "#E8B49A"],
  ["warm peach", "#E8A07A"],
  ["soft coral", "#E07A6A"],
  ["coral", "#E07060"],
  ["warm rose", "#C96B6B"],
  ["sheer pink", "#E8A8B0"],
  ["rose pink", "#D47A8C"],
  ["cool nude", "#C9A090"],
  ["soft mauve", "#B07A88"],
  ["dusty rose", "#C08080"],
  ["raspberry", "#B03A58"],
  ["cool rose", "#C45C70"],
  ["soft plum", "#8A4A62"],
  ["mauve", "#A06070"],
  ["soft berry", "#9A4060"],
  ["terracotta", "#C05A3A"],
  ["warm nude", "#D4A08A"],
  ["rust", "#B04428"],
  ["warm brick", "#A03828"],
  ["deep coral", "#C05040"],
  ["deep brick", "#8A2820"],
  ["burgundy", "#7A1C2A"],
  ["warm plum", "#7A3048"],
  ["deep fuchsia", "#C02060"],
  ["true red", "#C41C2C"],
  ["berry", "#8A2040"],
  ["hot pink", "#E02070"],
  ["cool berry", "#A02850"],
  ["blue-red", "#B01432"],
  ["fuchsia", "#D01868"],
  ["apricot", "#E8A070"],
  ["sheer orange", "#E07050"],
];

const EYE_HEX: [string, string][] = [
  ["warm bronze", "#A56B3A"],
  ["bronze", "#8A5A32"],
  ["deep bronze", "#6B3A20"],
  ["copper", "#B85C38"],
  ["golden champagne", "#E0C890"],
  ["champagne", "#E2CFA0"],
  ["soft gold", "#D4B46A"],
  ["warm olive", "#6B6A38"],
  ["soft olive", "#7A7848"],
  ["deep olive", "#4A4A28"],
  ["teal", "#2A6A6A"],
  ["forest green", "#2A4A32"],
  ["soft peach", "#E8B49A"],
  ["brown mascara", "#4A3020"],
  ["soft grey", "#8A8A92"],
  ["lilac", "#A090B8"],
  ["cool taupe", "#8A786C"],
  ["taupe", "#8A7464"],
  ["soft plum", "#8A4A62"],
  ["navy", "#1C2A4A"],
  ["muted plum", "#6A4050"],
  ["charcoal", "#3A3A40"],
  ["emerald", "#1C6A48"],
  ["silver", "#C8CCD4"],
  ["vivid violet", "#6A2A9A"],
  ["electric blue", "#2A5AD4"],
];

const CHEEK_HEX: [string, string][] = [
  ["peach", "#E8A888"],
  ["apricot", "#E09070"],
  ["warm apricot", "#E08860"],
  ["cool pink", "#E090A0"],
  ["soft rose", "#D48088"],
  ["cool rose", "#C86A78"],
  ["soft raspberry", "#C06070"],
  ["dusty pink", "#C88888"],
  ["soft mauve", "#B07A88"],
  ["soft terracotta", "#C07058"],
  ["warm bronze", "#C09068"],
  ["terracotta blush", "#C06848"],
  ["deep terracotta", "#B05038"],
  ["soft berry", "#C06078"],
  ["soft red", "#D06060"],
  ["cool bright pink", "#E06090"],
  ["soft fuchsia", "#D05080"],
];

const JEWEL_HEX: [string, string][] = [
  ["yellow gold", "#D4A017"],
  ["light gold", "#E0B84A"],
  ["antique gold", "#C4963A"],
  ["rose gold", "#B76E79"],
  ["cool rose gold", "#C08088"],
  ["silver", "#C0C5CC"],
  ["soft silver", "#D0D4D8"],
  ["platinum", "#E5E4E2"],
  ["copper", "#B87333"],
  ["warm bronze", "#8C6239"],
  ["pearl", "#F0E8DC"],
];

const SKIN: Record<AnalyzeResult["undertone"], string> = {
  warm: "#E8B896",
  cool: "#D4B5A8",
  neutral: "#E0C4B0",
};

function matchHex(label: string, table: [string, string][], fallback: string) {
  const hay = label.toLowerCase();
  const hit = table.find(([key]) => hay.includes(key));
  return { hex: hit?.[1] ?? fallback, name: label };
}

function unique(swatches: TryOnSwatch[]): TryOnSwatch[] {
  const seen = new Set<string>();
  return swatches.filter((s) => {
    const key = s.hex.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fromHints(
  labels: string[],
  table: [string, string][],
  fallback: string,
  extras: TryOnSwatch[] = [],
) {
  const recommended = labels.map((name) => ({
    ...matchHex(name, table, fallback),
    recommended: true,
  }));
  return unique([...recommended, ...extras]);
}

export function buildTryOnCatalog(result: AnalyzeResult): TryOnCatalog {
  const paletteExtras: TryOnSwatch[] = result.palette.slice(0, 4).map((s) => ({
    hex: s.hex,
    name: s.name,
    recommended: false,
  }));
  const options: Record<TryOnFeature, TryOnSwatch[]> = {
    hair: fromHints(result.styleGuide.hairColorHints, HAIR_HEX, "#5C3A28", paletteExtras),
    eyes: fromHints(result.styleGuide.makeup.eyes, EYE_HEX, "#8A5A32"),
    lips: fromHints(result.styleGuide.makeup.lips, LIP_HEX, "#C96B6B"),
    cheeks: fromHints(result.styleGuide.makeup.cheeks, CHEEK_HEX, "#E8A888"),
    jewelry: fromHints(
      result.styleGuide.jewelry,
      JEWEL_HEX,
      result.undertone === "cool" ? "#C0C5CC" : "#D4A017",
    ),
    dress: unique([
      ...result.palette.slice(0, 6).map((s) => ({ hex: s.hex, name: s.name, recommended: true })),
      ...paletteExtras.map((s) => ({ ...s, recommended: false })),
    ]),
  };
  const look: TryOnLook = {
    hair: options.hair[0]?.hex ?? "#5C3A28",
    eyes: options.eyes[0]?.hex ?? "#8A5A32",
    lips: options.lips[0]?.hex ?? "#C96B6B",
    cheeks: options.cheeks[0]?.hex ?? "#E8A888",
    jewelry: options.jewelry[0]?.hex ?? "#D4A017",
    dress: options.dress[0]?.hex ?? result.palette[0]?.hex ?? "#1C2A4A",
    skin: SKIN[result.undertone],
  };
  return { skin: look.skin, look, options };
}
