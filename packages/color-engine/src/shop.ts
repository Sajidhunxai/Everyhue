import type { SeasonId, ShopItem } from "@photomatcher/types";

/** Curated shop-style catalog keyed by season — search terms for external shopping. */
const CATALOG: ShopItem[] = [
  { id: "s1", category: "Suits", name: "Warm navy two-piece", hex: "#1E3A5F", seasonIds: ["true_spring", "bright_spring"], searchTerms: ["warm navy suit men", "navy suit warm undertone"] },
  { id: "s2", category: "Suits", name: "Charcoal slim suit", hex: "#36454F", seasonIds: ["true_winter", "deep_winter", "bright_winter"], searchTerms: ["charcoal suit cool undertone"] },
  { id: "s3", category: "Suits", name: "Olive tailored suit", hex: "#556B2F", seasonIds: ["true_autumn", "soft_autumn", "deep_autumn"], searchTerms: ["olive green suit"] },
  { id: "s4", category: "Shirts", name: "Ivory dress shirt", hex: "#FFFFF0", seasonIds: ["true_spring", "light_spring", "soft_autumn"], searchTerms: ["ivory dress shirt"] },
  { id: "s5", category: "Shirts", name: "Cool white oxford", hex: "#F8FAFC", seasonIds: ["true_winter", "bright_winter", "true_summer"], searchTerms: ["optic white shirt"] },
  { id: "s6", category: "Shirts", name: "Powder blue blouse", hex: "#B8D4E8", seasonIds: ["light_summer", "true_summer", "soft_summer"], searchTerms: ["powder blue blouse"] },
  { id: "s7", category: "Ties", name: "Coral silk tie", hex: "#FF6B3D", seasonIds: ["bright_spring", "true_spring"], searchTerms: ["coral silk tie"] },
  { id: "s8", category: "Ties", name: "Burgundy knit tie", hex: "#7F1D1D", seasonIds: ["deep_winter", "deep_autumn", "true_winter"], searchTerms: ["burgundy tie"] },
  { id: "s9", category: "Dresses", name: "Raspberry wrap dress", hex: "#BE123C", seasonIds: ["true_summer", "true_winter"], searchTerms: ["raspberry wrap dress"] },
  { id: "s10", category: "Dresses", name: "Terracotta midi", hex: "#BC6C25", seasonIds: ["soft_autumn", "true_autumn"], searchTerms: ["terracotta midi dress"] },
  { id: "s11", category: "Knitwear", name: "Soft mauve cashmere", hex: "#C9ADA7", seasonIds: ["soft_summer", "soft_autumn"], searchTerms: ["mauve sweater"] },
  { id: "s12", category: "Knitwear", name: "Electric blue crewneck", hex: "#2563EB", seasonIds: ["bright_winter", "true_winter"], searchTerms: ["electric blue sweater"] },
  { id: "s13", category: "Denim", name: "Medium warm wash jeans", hex: "#4A6FA5", seasonIds: ["true_spring", "light_spring"], searchTerms: ["medium wash jeans"] },
  { id: "s14", category: "Denim", name: "Dark indigo denim", hex: "#1E293B", seasonIds: ["deep_winter", "true_winter", "deep_autumn"], searchTerms: ["dark indigo jeans"] },
  { id: "s15", category: "Outerwear", name: "Camel wool coat", hex: "#C19A6B", seasonIds: ["true_autumn", "soft_autumn", "light_spring"], searchTerms: ["camel wool coat"] },
  { id: "s16", category: "Outerwear", name: "Black wool overcoat", hex: "#111827", seasonIds: ["true_winter", "deep_winter", "bright_winter"], searchTerms: ["black wool coat"] },
  { id: "s17", category: "Shoes", name: "Cognac leather loafers", hex: "#92400E", seasonIds: ["true_autumn", "true_spring", "soft_autumn"], searchTerms: ["cognac loafers"] },
  { id: "s18", category: "Shoes", name: "Black cap-toe oxfords", hex: "#0F172A", seasonIds: ["true_winter", "deep_winter"], searchTerms: ["black oxford shoes"] },
  { id: "s19", category: "Makeup", name: "Warm coral lipstick", hex: "#EF476F", seasonIds: ["bright_spring", "light_spring"], searchTerms: ["coral lipstick warm"] },
  { id: "s20", category: "Makeup", name: "Cool rose lipstick", hex: "#E11D48", seasonIds: ["true_summer", "bright_winter"], searchTerms: ["cool rose lipstick"] },
  { id: "s21", category: "Accessories", name: "Gold hoop earrings", hex: "#D4AF37", seasonIds: ["true_spring", "true_autumn", "bright_spring"], searchTerms: ["gold hoop earrings"] },
  { id: "s22", category: "Accessories", name: "Silver chain necklace", hex: "#C0C0C0", seasonIds: ["true_summer", "true_winter", "light_summer"], searchTerms: ["silver chain necklace"] },
  { id: "s23", category: "Scarves", name: "Dusty rose silk scarf", hex: "#E0B1CB", seasonIds: ["soft_summer", "light_summer"], searchTerms: ["dusty rose scarf"] },
  { id: "s24", category: "Scarves", name: "Mustard wool scarf", hex: "#CA8A04", seasonIds: ["true_autumn", "deep_autumn"], searchTerms: ["mustard scarf"] },
];

export function shopForSeason(seasonId: SeasonId, category?: string): ShopItem[] {
  return CATALOG.filter(
    (item) =>
      item.seasonIds.includes(seasonId) &&
      (!category || item.category.toLowerCase() === category.toLowerCase()),
  );
}

export function shopCategories(seasonId: SeasonId): string[] {
  const cats = new Set(shopForSeason(seasonId).map((i) => i.category));
  return [...cats].sort();
}

export function shopByHex(seasonId: SeasonId, hex: string): ShopItem[] {
  const normalized = hex.toUpperCase();
  return shopForSeason(seasonId).filter(
    (item) => item.hex.toUpperCase() === normalized,
  );
}

export function allShopItems(): ShopItem[] {
  return CATALOG;
}
