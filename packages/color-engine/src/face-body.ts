import type { BodyType, FaceBodyTips, FaceShape, SeasonId } from "@photomatcher/types";

const FACE: Record<FaceShape, Omit<FaceBodyTips, "faceShape" | "bodyType">> = {
  oval: {
    neckline: ["V-neck", "Scoop neck", "Most collar styles work well"],
    eyewear: ["Soft rectangular frames", "Cat-eye with gentle angles"],
    silhouettes: ["Balanced proportions — most jacket lengths work"],
    patterns: ["Medium-scale prints", "Vertical lines for elongation"],
    accessories: ["Statement earrings", "Delicate layered necklaces"],
  },
  round: {
    neckline: ["Deep V-neck", "Long pendant lines", "Avoid high tight collars"],
    eyewear: ["Angular or rectangular frames", "Avoid round frames"],
    silhouettes: ["Structured shoulders", "Longer cardigans and blazers"],
    patterns: ["Vertical stripes", "Long pendants and open necklines"],
    accessories: ["Long necklaces", "Drop earrings"],
  },
  square: {
    neckline: ["Round and scoop necks", "Soft cowl necklines"],
    eyewear: ["Round or oval frames", "Soft cat-eye"],
    silhouettes: ["Soft draped fabrics", "Curved hemlines"],
    patterns: ["Flowing florals", "Avoid harsh boxy grid checks at jaw level"],
    accessories: ["Rounded hoop earrings", "Soft scarf drapes"],
  },
  heart: {
    neckline: ["Boat neck", "Wide scoop", "Balance with detail at neckline"],
    eyewear: ["Bottom-heavy frames", "Light-colored lower rim"],
    silhouettes: ["A-line skirts", "Wide-leg trousers", "Volume below the waist"],
    patterns: ["Bottom-weighted prints on skirts or pants"],
    accessories: ["Wider belts on hips", "Minimal heavy top embellishment"],
  },
  oblong: {
    neckline: ["Boat neck", "Collared shirts with horizontal detail"],
    eyewear: ["Wide frames", "Decorative temples"],
    silhouettes: ["Layered tops", "Cropped jackets", "Break vertical lines"],
    patterns: ["Horizontal stripes at bust or hip", "Color blocking"],
    accessories: ["Wide belts", "Chunky scarves"],
  },
  diamond: {
    neckline: ["Halter", "Boat neck", "Detail at shoulders"],
    eyewear: ["Oval or rimless styles", "Cat-eye with width at brow"],
    silhouettes: ["Structured shoulders", "Defined waist", "Full skirts"],
    patterns: ["Shoulder emphasis", "A-line shapes"],
    accessories: ["Statement shoulder bags", "Bold earrings at cheekbone level"],
  },
};

const BODY: Record<BodyType, { silhouettes: string[]; tops: string[]; bottoms: string[] }> = {
  balanced: {
    silhouettes: ["Classic tailored fits", "Wrap dresses", "Straight-leg trousers"],
    tops: ["Fitted blouses", "Structured knits"],
    bottoms: ["Mid-rise straight denim", "Tailored trousers"],
  },
  pear: {
    silhouettes: ["Volume on top, clean lines below", "A-line skirts", "Wide-leg pants"],
    tops: ["Boat neck", "Structured shoulders", "Bright palette colors up top"],
    bottoms: ["Dark neutrals on bottom", "Straight or bootcut leg"],
  },
  apple: {
    silhouettes: ["Empire waist", "Open front layers", "Vertical line details"],
    tops: ["V-neck tunics", "Longline cardigans"],
    bottoms: ["Straight leg", "Bootcut to balance"],
  },
  hourglass: {
    silhouettes: ["Belted waist", "Wrap styles", "Fitted sheath"],
    tops: ["Wrap blouses", "Peplum in your palette"],
    bottoms: ["High-rise tailored pants", "Pencil skirts in season colors"],
  },
  rectangle: {
    silhouettes: ["Create waist with belts", "Peplum tops", "Layered textures"],
    tops: ["Ruffles and detail at bust", "Color blocking"],
    bottoms: ["Pleated skirts", "Tapered ankle trousers"],
  },
  inverted_triangle: {
    silhouettes: ["Volume on bottom", "Minimal shoulder padding", "Wide-leg pants"],
    tops: ["Deep necklines", "Soft drape", "Avoid heavy shoulder detail"],
    bottoms: ["Full skirts", "Wide-leg trousers", "Bold color on bottom half"],
  },
};

export function getFaceBodyTips(
  faceShape: FaceShape,
  bodyType: BodyType,
): FaceBodyTips {
  const face = FACE[faceShape];
  const body = BODY[bodyType];
  return {
    faceShape,
    bodyType,
    neckline: face.neckline,
    eyewear: face.eyewear,
    silhouettes: [...face.silhouettes, ...body.silhouettes],
    patterns: face.patterns,
    accessories: face.accessories,
  };
}

export function seasonFaceBodyNote(seasonId: SeasonId, faceShape: FaceShape): string {
  const warm = seasonId.includes("spring") || seasonId.includes("autumn");
  if (warm && (faceShape === "round" || faceShape === "square")) {
    return "Warm seasons pair well with soft necklines that echo your palette's golden or earthy tones.";
  }
  if (!warm && faceShape === "diamond") {
    return "Cool seasons shine with crisp collar lines and jewel-tone accents near the face.";
  }
  return "Use your seasonal palette near the face — collars, scarves, and makeup matter most.";
}
