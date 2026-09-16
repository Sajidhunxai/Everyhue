export type TryOnFeature = "hair" | "eyes" | "lips" | "cheeks" | "jewelry";

export type TryOnSwatch = {
  hex: string;
  name: string;
  recommended: boolean;
};

export type TryOnLook = {
  hair: string;
  eyes: string;
  lips: string;
  cheeks: string;
  jewelry: string;
  skin: string;
};

export type TryOnCatalog = {
  skin: string;
  look: TryOnLook;
  options: Record<TryOnFeature, TryOnSwatch[]>;
};
