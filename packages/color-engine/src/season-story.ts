import type { SeasonId } from "@photomatcher/types";

function photo(id: string, w = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`;
}

export type SeasonFamily = "spring" | "summer" | "autumn" | "winter";

export function seasonFamily(id: SeasonId): SeasonFamily {
  if (id.includes("spring")) return "spring";
  if (id.includes("summer")) return "summer";
  if (id.includes("autumn")) return "autumn";
  return "winter";
}

const HERO: Record<SeasonFamily, string> = {
  spring: photo("photo-1490750967868-88aa4486c946"),
  summer: photo("photo-1462275646964-a0e3386b89fa"),
  autumn: photo("photo-1477414348463-c0eb7f1359b6"),
  winter: photo("photo-1418985991508-e47386d96a71"),
};

const MOOD: Record<SeasonFamily, string> = {
  spring: "Warm, clear, and blooming",
  summer: "Soft, cool, and powdery",
  autumn: "Rich, earthy, and golden",
  winter: "Cool, crisp, and high-contrast",
};

const BLURB: Record<SeasonId, string> = {
  bright_spring: "Think citrus, coral, and sunlight on fresh leaves — colors that look alive on you.",
  true_spring: "Warm peach, camel, and grass green: a classic spring wardrobe that never looks muddy.",
  light_spring: "Ivory, apricot, and light aqua — keep everything airy so your coloring stays the brightest thing in the room.",
  light_summer: "Rose, lavender, and sky blue: light, cool, and gently blended rather than sharp.",
  true_summer: "Dusty rose, slate, and soft teal. Your best clothes look like they were washed in cool water.",
  soft_summer: "Mushroom, sage, and muted berry — low contrast, no neon, lots of softness.",
  soft_autumn: "Taupe, olive, and faded terracotta. Warm, but never loud.",
  true_autumn: "Rust, camel, forest, and gold — harvest colors with a little grit.",
  deep_autumn: "Espresso, burgundy, and moss. Deep, warm, and quietly dramatic.",
  deep_winter: "Ink, emerald, and ruby. High contrast against clear winter skin.",
  true_winter: "True red, royal blue, and icy white. Sharp edges, no dusty pastels.",
  bright_winter: "Fuchsia, cobalt, and black-white snap. Your colors should sparkle, not fade.",
};

export const RESULT_IMAGES = {
  suits: photo("photo-1594938298603-c8148c4dae35", 900),
  shirts: photo("photo-1596755094514-f87e34085b2c", 900),
  casual: photo("photo-1483985988355-763728e1935b", 900),
  dresses: photo("photo-1595777457583-95e059d581b8", 900),
  ties: photo("photo-1523381294919-8ddc6d6120d3", 900),
  denim: photo("photo-1542272604-787c3835535d", 900),
  outerwear: photo("photo-1539533018447-63fcce2678e3", 900),
  shoes: photo("photo-1543163521-1bf539c55dd2", 900),
  makeup: photo("photo-1487412947147-5cebf100ffc2", 900),
  jewelry: photo("photo-1515562141207-7a88fb7ce338", 900),
  hair: photo("photo-1522337360788-8b13dee7a37e", 900),
  occasion: photo("photo-1519741497674-611481863552", 900),
  eyewear: photo("photo-1572635196237-14b3f281503f", 900),
  fit: photo("photo-1487412720507-e7ab37603c6f", 900),
};

export function seasonStory(id: SeasonId, label: string) {
  const family = seasonFamily(id);
  return {
    family,
    hero: HERO[family],
    mood: MOOD[family],
    blurb: BLURB[id] ?? `A complete color story for ${label}.`,
  };
}
