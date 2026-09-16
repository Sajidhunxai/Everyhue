export type LabColor = {
  L: number;
  a: number;
  b: number;
};

export type SeasonId =
  | "bright_spring"
  | "true_spring"
  | "light_spring"
  | "light_summer"
  | "true_summer"
  | "soft_summer"
  | "soft_autumn"
  | "true_autumn"
  | "deep_autumn"
  | "deep_winter"
  | "true_winter"
  | "bright_winter";

export type PaletteSwatch = {
  hex: string;
  name: string;
};

export type { StyleGuide, ContrastLevel, ValueDepth, MakeupGuide, OccasionTip } from "./style-guide";
import type { StyleGuide } from "./style-guide";

export type AnalyzeLabRequest = {
  mode: "lab";
  samples: LabColor[];
};

export type AnalyzeImageMeta = {
  mode: "image";
  /** Client may send average Lab samples derived on-device; raw image bytes handled separately as multipart. */
  samples?: LabColor[];
};

export type AnalyzeRequestBody = AnalyzeLabRequest | AnalyzeImageMeta;

export type AnalyzeResult = {
  engine_version: string;
  seasonId: SeasonId;
  seasonLabel: string;
  confidence: number;
  undertone: "warm" | "cool" | "neutral";
  palette: PaletteSwatch[];
  avoid: PaletteSwatch[];
  tips: string[];
  styleGuide: StyleGuide;
  faceBodyTips?: import("./features").FaceBodyTips;
};

export type UserPublic = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type { TryOnFeature, TryOnSwatch, TryOnLook, TryOnCatalog } from "./try-on";
export type {
  FaceShape,
  BodyType,
  FaceBodyTips,
  ComparePhotoInput,
  ComparePhotoSummary,
  CompareResult,
  PaletteMatchVerdict,
  PaletteMatch,
  SavedLook,
  ShopItem,
  WardrobeItem,
  FamilyProfile,
  StylistMessage,
  SavedAnalysis,
  AnalyzeOptions,
  StylistContext,
} from "./features";
export type {
  StyleQuizAnswers,
  StyleQuizQuestion,
  StyleQuizOption,
  StyleQuizResult,
  StyleQuizOutfit,
  StyleQuizPayload,
  CustomQuizOption,
  CustomQuizQuestion,
  QuizTemplate,
} from "./style-quiz";
