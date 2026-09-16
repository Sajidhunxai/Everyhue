import type { AnalyzeResult, PaletteSwatch, SeasonId } from "./index";

export type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "oblong"
  | "diamond";

export type BodyType =
  | "balanced"
  | "pear"
  | "apple"
  | "hourglass"
  | "rectangle"
  | "inverted_triangle";

export type FaceBodyTips = {
  faceShape: FaceShape;
  bodyType: BodyType;
  neckline: string[];
  eyewear: string[];
  silhouettes: string[];
  patterns: string[];
  accessories: string[];
};

export type ComparePhotoInput = {
  label: string;
  samples: { L: number; a: number; b: number }[];
};

export type ComparePhotoSummary = {
  label: string;
  undertoneHint: string;
  brightness: string;
  score: number;
};

export type CompareResult = {
  lightingScore: number;
  consistencyScore: number;
  recommendation: string;
  photoA: ComparePhotoSummary;
  photoB: ComparePhotoSummary;
  betterPhoto: "A" | "B" | "tie";
  lightingTips: string[];
};

export type PaletteMatchVerdict = "excellent" | "good" | "fair" | "poor" | "avoid";

export type PaletteMatch = {
  hex: string;
  score: number;
  verdict: PaletteMatchVerdict;
  deltaE: number;
  closest: PaletteSwatch;
  nearestAvoid: PaletteSwatch | null;
};

export type SavedLook = {
  id: string;
  name: string;
  occasion: string;
  hexes: string[];
  itemIds: string[];
  score: number | null;
  createdAt: string;
};

export type ShopItem = {
  id: string;
  category: string;
  name: string;
  hex: string;
  seasonIds: SeasonId[];
  searchTerms: string[];
};

export type WardrobeItem = {
  id: string;
  hex: string;
  name: string;
  category: string;
  notes?: string;
  createdAt: string;
};

export type FamilyProfile = {
  id: string;
  name: string;
  relation: string;
  lastAnalysis?: AnalyzeResult | null;
  createdAt: string;
};

export type StylistMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type SavedAnalysis = {
  id: string;
  result: AnalyzeResult;
  title?: string | null;
  notes?: string | null;
  hasPhoto?: boolean;
  photoDataUrl?: string | null;
  faceShape?: FaceShape;
  bodyType?: BodyType;
  profileId?: string | null;
  createdAt: string;
};

export type AnalyzeOptions = {
  faceShape?: FaceShape;
  bodyType?: BodyType;
  profileId?: string;
};

export type StylistContext = {
  seasonLabel: string;
  undertone: string;
  palette: PaletteSwatch[];
  neutrals: string[];
};
