export type ContrastLevel = "low" | "medium" | "high";
export type ValueDepth = "light" | "medium" | "deep";

export type MakeupGuide = {
  lips: string[];
  cheeks: string[];
  eyes: string[];
};

export type OccasionTip = {
  label: string;
  suggestion: string;
};

/** Wardrobe and beauty recommendations derived from seasonal analysis. */
export type StyleGuide = {
  contrastLevel: ContrastLevel;
  valueDepth: ValueDepth;
  suits: string[];
  shirtsAndBlouses: string[];
  tiesAndScarves: string[];
  casualWear: string[];
  dressesAndSkirts: string[];
  denim: string[];
  outerwear: string[];
  shoesAndBags: string[];
  makeup: MakeupGuide;
  jewelry: string[];
  hairColorHints: string[];
  patterns: string[];
  neutrals: string[];
  occasions: OccasionTip[];
};
