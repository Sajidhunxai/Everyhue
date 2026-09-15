import type {
  AnalyzeResult,
  StyleQuizAnswers,
  StyleQuizOption,
  StyleQuizQuestion,
  StyleQuizResult,
} from "@photomatcher/types";

export const STYLE_QUIZ_QUESTIONS: StyleQuizQuestion[] = [
  {
    id: "primaryGoal",
    title: "What's your style goal right now?",
    subtitle: "We'll tailor recommendations to what matters most to you.",
    options: [
      { value: "polished", emoji: "💼", label: "Look polished & professional", desc: "Work-ready confidence" },
      { value: "effortless", emoji: "✨", label: "Effortless everyday style", desc: "Smart without overthinking" },
      { value: "events", emoji: "🥂", label: "Stand out at events", desc: "Weddings, parties, photos" },
      { value: "wardrobe", emoji: "🧥", label: "Build a complete wardrobe", desc: "Cohesive closet from scratch" },
    ],
  },
  {
    id: "occasions",
    title: "Which occasions are on your radar?",
    subtitle: "Pick all that apply — we'll prioritize outfit ideas for these.",
    multi: true,
    options: [
      { value: "interview", emoji: "🎯", label: "Job interviews" },
      { value: "office", emoji: "🏢", label: "Daily office" },
      { value: "wedding", emoji: "💍", label: "Weddings & formal events" },
      { value: "date", emoji: "❤️", label: "Dates & evenings out" },
      { value: "weekend", emoji: "☀️", label: "Weekends & travel" },
      { value: "presentation", emoji: "🎤", label: "Presentations & client meetings" },
    ],
  },
  {
    id: "formalFocus",
    title: "How do you feel about suits & tailoring?",
    subtitle: "Be honest — we'll meet you where you are.",
    options: [
      { value: "suits", emoji: "🤵", label: "Suits are my go-to", desc: "I want specific suit guidance" },
      { value: "blazers", emoji: "🧥", label: "Blazers & smart separates", desc: "Polished but not always a full suit" },
      { value: "both", emoji: "⚖️", label: "Mix of both", desc: "Depends on the occasion" },
      { value: "casual", emoji: "👕", label: "Mostly smart casual", desc: "Rarely wear full suits" },
    ],
  },
  {
    id: "fitPreference",
    title: "What fit feels most like you?",
    subtitle: "Fit changes how your best colors read on camera and in person.",
    options: [
      { value: "classic", emoji: "📐", label: "Classic tailored", desc: "Structured shoulders, clean lines" },
      { value: "modern", emoji: "🔷", label: "Modern slim", desc: "Closer cut, contemporary" },
      { value: "relaxed", emoji: "🌿", label: "Relaxed & comfortable", desc: "Ease of movement first" },
      { value: "unsure", emoji: "🤔", label: "Still figuring it out", desc: "Show me what suits my season" },
    ],
  },
  {
    id: "helpAreas",
    title: "What do you want the most help with?",
    subtitle: "Pick up to 3 — we'll go deep on these.",
    multi: true,
    options: [
      { value: "suits", emoji: "🤵", label: "Suits & formalwear" },
      { value: "shirts", emoji: "👔", label: "Shirts, blouses & ties" },
      { value: "casual", emoji: "👖", label: "Casual & weekend wear" },
      { value: "shoes", emoji: "👞", label: "Shoes & bags" },
      { value: "grooming", emoji: "💄", label: "Makeup & grooming" },
      { value: "jewelry", emoji: "💎", label: "Jewelry & metals" },
    ],
  },
  {
    id: "budget",
    title: "What's your shopping mindset?",
    subtitle: "We'll shape a realistic priority list.",
    options: [
      { value: "invest", emoji: "⭐", label: "Invest in fewer, quality pieces" },
      { value: "mix", emoji: "🔄", label: "Mix quality staples with trends" },
      { value: "budget", emoji: "💡", label: "Budget-smart basics first" },
      { value: "refresh", emoji: "🛍️", label: "Refreshing what I already own" },
    ],
  },
];

const GOAL_HEADLINES: Record<string, string> = {
  polished: "Your power palette for a polished professional look",
  effortless: "Your easy everyday formula in your best colors",
  events: "Your event-ready style playbook",
  wardrobe: "Your complete wardrobe blueprint",
};

const FIT_NOTES: Record<string, string> = {
  classic: "Choose structured shoulders and a clean break on trousers — your seasonal contrast reads best with crisp lines.",
  modern: "A slimmer lapel and tapered leg keeps your palette looking intentional, not washed out.",
  relaxed: "Soft tailoring and natural fabrics let your colors shine without feeling stiff.",
  unsure: "Start with classic fit in your deepest neutral, then adjust based on what frames your face best.",
};

const OCCASION_MAP: Record<string, string[]> = {
  interview: ["Business", "Interview"],
  office: ["Business", "Office"],
  wedding: ["Evening", "Wedding", "Formal"],
  date: ["Date night", "Evening", "Date"],
  weekend: ["Casual", "Weekend"],
  presentation: ["Business", "Presentation"],
};

export function buildStyleQuizResult(
  analysis: AnalyzeResult,
  answers: StyleQuizAnswers,
): StyleQuizResult {
  const guide = analysis.styleGuide;
  const paletteNames = analysis.palette.slice(0, 4).map((p) => p.name);
  const accent = paletteNames[0] ?? "your signature shade";
  const neutral = guide.neutrals[0] ?? paletteNames[1] ?? "a deep neutral";
  const secondNeutral = guide.neutrals[1] ?? paletteNames[2] ?? neutral;

  const headline = GOAL_HEADLINES[answers.primaryGoal] ?? `Your ${analysis.seasonLabel} style guide`;

  const summary = `As ${analysis.seasonLabel} with a ${analysis.undertone} undertone, your wardrobe works best when built on ${guide.neutrals.slice(0, 2).join(" and ") || "your core neutrals"} with accents in ${paletteNames.join(", ")}. ${FIT_NOTES[answers.fitPreference] ?? FIT_NOTES.unsure}`;

  const personalityParts: string[] = [];
  if (answers.formalFocus === "suits" || answers.formalFocus === "both") {
    personalityParts.push("tailored and confident");
  }
  if (answers.primaryGoal === "effortless" || answers.formalFocus === "casual") {
    personalityParts.push("approachable and relaxed");
  }
  if (answers.primaryGoal === "events") {
    personalityParts.push("memorable in photos");
  }
  const stylePersonality = `Your style personality: ${personalityParts.length ? personalityParts.join(", ") : "balanced and versatile"} — anchored in ${analysis.seasonLabel} colors with ${guide.contrastLevel} contrast.`;

  const suitPicks = buildSuitPicks(analysis, answers, accent, neutral, secondNeutral);

  const outfitIdeas = buildOutfitIdeas(analysis, answers, accent, neutral);

  const shoppingList = buildShoppingList(analysis, answers, accent, neutral);

  const groomingTips = buildGroomingTips(analysis, answers);

  const nextSteps = [
    `Save your top 3 palette swatches (${paletteNames.join(", ")}) to your Wardrobe.`,
    "Compare two daylight photos before your next analysis refresh.",
    `Ask the AI stylist: "Build me 3 ${answers.occasions[0] ?? "office"} outfits from my palette."`,
    "Export your style card as PDF and bring it shopping.",
  ];

  return {
    headline,
    summary,
    stylePersonality,
    suitPicks,
    outfitIdeas,
    shoppingList,
    groomingTips,
    nextSteps,
  };
}

function buildSuitPicks(
  analysis: AnalyzeResult,
  answers: StyleQuizAnswers,
  accent: string,
  neutral: string,
  secondNeutral: string,
) {
  const guide = analysis.styleGuide;
  const picks: StyleQuizResult["suitPicks"] = [];

  const formalWeight =
    answers.formalFocus === "suits" ? 3 : answers.formalFocus === "both" ? 2 : answers.formalFocus === "blazers" ? 1 : 0;

  if (formalWeight >= 1 || answers.helpAreas.includes("suits")) {
    guide.suits.slice(0, 2).forEach((s, i) => {
      picks.push({
        title: i === 0 ? "Your #1 suit direction" : "Strong alternate",
        detail: `${s} Pair with ${guide.shirtsAndBlouses[0] ?? "a shirt in your neutral range"} and a tie or pocket square in ${accent}.`,
        priority: i === 0 ? "essential" : "recommended",
      });
    });
  }

  if (answers.formalFocus === "blazers" || answers.formalFocus === "both" || answers.formalFocus === "casual") {
    picks.push({
      title: "Smart blazer formula",
      detail: `${guide.outerwear[0] ?? "A structured blazer in " + neutral} over ${guide.shirtsAndBlouses[1] ?? "a soft knit or blouse"} — works for ${answers.occasions.includes("office") ? "office" : "smart casual"} without a full suit.`,
      priority: formalWeight >= 2 ? "recommended" : "essential",
    });
  }

  if (answers.occasions.includes("interview") || answers.occasions.includes("presentation")) {
    picks.push({
      title: "Interview & presentation suit",
      detail: `Choose the deepest neutral (${neutral}) with minimal pattern. Shirt in ${guide.shirtsAndBlouses[0]?.split(",")[0] ?? "warm/cool white per your undertone"}. One accent only: ${accent} tie or subtle pocket square — avoid loud contrast that competes with your face.`,
      priority: "essential",
    });
  }

  if (answers.occasions.includes("wedding")) {
    picks.push({
      title: "Wedding guest / formal",
      detail: `${guide.suits[1] ?? guide.suits[0]} Add ${guide.tiesAndScarves[0] ?? accent + " accent"} and ${guide.shoesAndBags[0] ?? "leather in your neutral range"}.`,
      priority: "recommended",
    });
  }

  if (answers.budget === "budget") {
    picks.push({
      title: "Budget-first move",
      detail: `Start with one ${neutral} blazer and ${secondNeutral} trousers from the same fabric family — reads as a suit, costs less than full tailoring.`,
      priority: "essential",
    });
  }

  if (!picks.length) {
    picks.push({
      title: "Seasonal suit starting point",
      detail: guide.suits[0] ?? `Build around ${neutral} with ${accent} accents.`,
      priority: "essential",
    });
  }

  return picks.slice(0, 5);
}

function buildOutfitIdeas(
  analysis: AnalyzeResult,
  answers: StyleQuizAnswers,
  accent: string,
  neutral: string,
): StyleQuizResult["outfitIdeas"] {
  const guide = analysis.styleGuide;
  const ideas: StyleQuizResult["outfitIdeas"] = [];

  for (const occ of answers.occasions) {
    const labels = OCCASION_MAP[occ] ?? ["Casual"];
    const match = guide.occasions.find((o) =>
      labels.some((l) => o.label.toLowerCase().includes(l.toLowerCase())),
    );
    if (match) {
      ideas.push({
        occasion: match.label,
        title: match.suggestion.split(",")[0] ?? match.suggestion,
        detail: match.suggestion,
        colors: [accent, neutral, analysis.palette[1]?.name ?? accent],
      });
      continue;
    }
    const fallback = occasionFallback(occ, guide, accent, neutral);
    if (fallback) ideas.push(fallback);
  }

  if (answers.helpAreas.includes("casual") || answers.primaryGoal === "effortless") {
    ideas.push({
      occasion: "Weekend",
      title: "Easy casual uniform",
      detail: `${guide.casualWear[0] ?? "Neutral base"} + ${guide.casualWear[1] ?? accent + " top"} + ${guide.denim[0] ?? "denim in your undertone"}.`,
      colors: [neutral, accent],
    });
  }

  if (ideas.length < 3) {
    guide.occasions.slice(0, 3 - ideas.length).forEach((o) => {
      ideas.push({
        occasion: o.label,
        title: o.suggestion.slice(0, 40),
        detail: o.suggestion,
        colors: [accent, neutral],
      });
    });
  }

  return ideas.slice(0, 6);
}

function occasionFallback(
  occ: string,
  guide: AnalyzeResult["styleGuide"],
  accent: string,
  neutral: string,
): StyleQuizResult["outfitIdeas"][0] | null {
  const map: Record<string, { label: string; detail: string }> = {
    interview: {
      label: "Interview",
      detail: `${guide.suits[0]} with ${guide.shirtsAndBlouses[0]} and a ${accent} accent. Keep jewelry minimal.`,
    },
    office: {
      label: "Office",
      detail: `${guide.suits[0] ?? neutral + " separates"} with ${guide.tiesAndScarves[0] ?? accent} accent.`,
    },
    wedding: {
      label: "Wedding",
      detail: `${guide.suits[1] ?? guide.suits[0]} — avoid upstaging; stay in your palette neutrals with one accent.`,
    },
    date: {
      label: "Date night",
      detail: `${guide.dressesAndSkirts[0] ?? guide.casualWear[0]} with ${guide.jewelry[0] ?? accent + " metal"} accents.`,
    },
    weekend: {
      label: "Weekend",
      detail: `${guide.casualWear[0]} + ${guide.denim[0] ?? "denim"} + ${guide.shoesAndBags[0] ?? "neutral shoes"}.`,
    },
    presentation: {
      label: "Presentation",
      detail: `High-contrast look: ${neutral} base, ${accent} tie or blouse, ${guide.shoesAndBags[0] ?? "polished shoes"}.`,
    },
  };
  const item = map[occ];
  if (!item) return null;
  return { occasion: item.label, title: item.label, detail: item.detail, colors: [accent, neutral] };
}

function buildShoppingList(
  analysis: AnalyzeResult,
  answers: StyleQuizAnswers,
  accent: string,
  neutral: string,
) {
  const guide = analysis.styleGuide;
  const list: StyleQuizResult["shoppingList"] = [];

  if (answers.helpAreas.includes("suits") || answers.formalFocus !== "casual") {
    list.push({ item: "Core suit or suit separates", why: guide.suits[0] ?? `In ${neutral}` });
    list.push({ item: "Dress shirt or blouse (×2)", why: guide.shirtsAndBlouses.slice(0, 2).join("; ") });
    list.push({ item: "Tie or pocket square", why: guide.tiesAndScarves[0] ?? accent });
  }

  if (answers.helpAreas.includes("shirts")) {
    list.push({ item: "Shirt refresh", why: guide.shirtsAndBlouses.join("; ") });
  }

  if (answers.helpAreas.includes("casual") || answers.primaryGoal === "effortless") {
    list.push({ item: "Casual knit or tee", why: guide.casualWear[0] ?? accent });
    list.push({ item: "Denim / chinos", why: guide.denim[0] ?? "Undertone-matched wash" });
  }

  if (answers.helpAreas.includes("shoes")) {
    list.push({ item: "Shoes", why: guide.shoesAndBags.join("; ") });
  }

  if (answers.helpAreas.includes("grooming")) {
    list.push({ item: "Lip / cheek color", why: guide.makeup.lips[0] + " + " + guide.makeup.cheeks[0] });
  }

  if (answers.helpAreas.includes("jewelry")) {
    list.push({ item: "Jewelry metal", why: guide.jewelry.join(", ") });
  }

  if (answers.budget === "invest" && list.length) {
    list.unshift({
      item: "First investment piece",
      why: `One impeccably tailored ${neutral} blazer — highest cost-per-wear for ${analysis.seasonLabel}.`,
    });
  }

  if (answers.budget === "refresh") {
    list.push({
      item: "Accent refresh",
      why: `Add one ${accent} accessory to update existing neutrals without replacing everything.`,
    });
  }

  return list.slice(0, 8);
}

function buildGroomingTips(analysis: AnalyzeResult, answers: StyleQuizAnswers): string[] {
  const guide = analysis.styleGuide;
  const tips: string[] = [];

  if (answers.helpAreas.includes("grooming") || answers.primaryGoal === "events") {
    tips.push(`Lips: ${guide.makeup.lips.slice(0, 2).join(" or ")}`);
    tips.push(`Cheeks: ${guide.makeup.cheeks.join(", ")}`);
    tips.push(`Eyes: ${guide.makeup.eyes.slice(0, 2).join(", ")}`);
  }

  if (answers.helpAreas.includes("jewelry")) {
    tips.push(`Metals & stones: ${guide.jewelry.join(", ")}`);
  }

  tips.push(`Hair: ${guide.hairColorHints[0] ?? "Stay in undertone-aligned tones"}`);
  tips.push(`Patterns to embrace: ${guide.patterns.slice(0, 2).join(", ")}`);

  return tips.slice(0, 5);
}

export function emptyStyleQuizAnswers(): StyleQuizAnswers {
  return {
    primaryGoal: "",
    occasions: [],
    formalFocus: "",
    fitPreference: "",
    helpAreas: [],
    budget: "",
  };
}

export function isStyleQuizComplete(answers: StyleQuizAnswers): boolean {
  return Boolean(
    answers.primaryGoal &&
      answers.occasions.length > 0 &&
      answers.formalFocus &&
      answers.fitPreference &&
      answers.helpAreas.length > 0 &&
      answers.budget,
  );
}
