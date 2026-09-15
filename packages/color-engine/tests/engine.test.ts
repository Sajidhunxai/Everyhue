import { describe, expect, it } from "vitest";
import { comparePhotos } from "../src/compare";
import {
  STYLE_QUIZ_QUESTIONS,
  buildStyleQuizResult,
  emptyStyleQuizAnswers,
  isStyleQuizComplete,
} from "../src/style-quiz";
import {
  validateLabSamplesForAnalysis,
  validatePhotoForAnalysis,
} from "../src/photo-validation";
import { stylistReply } from "../src/stylist-chat";
import { ENGINE_VERSION, matchSeason, srgbToLab } from "../src/index";

describe("srgbToLab", () => {
  it("converts mid grey roughly to L~53 a~0 b~0", () => {
    const lab = srgbToLab(128, 128, 128);
    expect(lab.L).toBeGreaterThan(45);
    expect(lab.L).toBeLessThan(60);
    expect(Math.abs(lab.a)).toBeLessThan(3);
    expect(Math.abs(lab.b)).toBeLessThan(3);
  });

  it("gives warm peach higher b* than cool pink", () => {
    const peach = srgbToLab(240, 180, 140);
    const coolPink = srgbToLab(220, 160, 180);
    expect(peach.b).toBeGreaterThan(coolPink.b);
  });
});

describe("matchSeason", () => {
  it("returns engine version and a season", () => {
    const warm = srgbToLab(210, 150, 110);
    const result = matchSeason([warm]);
    expect(result.engine_version).toBe(ENGINE_VERSION);
    expect(result.seasonLabel.length).toBeGreaterThan(0);
    expect(result.palette.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("prefers cool seasons for cool Lab samples", () => {
    const cool = { L: 60, a: 12, b: -2 };
    const result = matchSeason([cool]);
    expect(result.undertone).toBe("cool");
  });

  it("includes a style guide with suits and makeup", () => {
    const warm = srgbToLab(210, 150, 110);
    const result = matchSeason([warm], { faceShape: "oval", bodyType: "balanced" });
    expect(result.styleGuide.suits.length).toBeGreaterThan(0);
    expect(result.faceBodyTips?.faceShape).toBe("oval");
  });
});

describe("comparePhotos", () => {
  it("compares two photo samples", () => {
    const a = [{ L: 60, a: 10, b: 20 }];
    const b = [{ L: 45, a: 8, b: 15 }];
    const result = comparePhotos({ label: "A", samples: a }, { label: "B", samples: b });
    expect(result.lightingScore).toBeGreaterThan(0);
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});

describe("stylistReply", () => {
  const ctx = {
    seasonLabel: "Deep Winter",
    undertone: "cool",
    palette: [
      { hex: "#0B0F14", name: "Midnight" },
      { hex: "#7B1E3A", name: "Garnet" },
      { hex: "#1B2A4A", name: "Navy Deep" },
      { hex: "#4A2D5C", name: "Royal Plum" },
      { hex: "#F5F5F5", name: "Snow" },
    ],
    neutrals: ["Black", "Charcoal"],
  };

  it("returns suit advice", () => {
    const reply = stylistReply("What suit for interview?", ctx);
    expect(reply.toLowerCase()).toContain("suit");
  });

  it("handles what should i wear", () => {
    const reply = stylistReply("what should i wear", ctx);
    expect(reply).toContain("Deep Winter");
    expect(reply.toLowerCase()).not.toContain("ask me about suits");
  });

  it("handles jewelry typos", () => {
    const reply = stylistReply("jewlary", ctx);
    expect(reply.toLowerCase()).toMatch(/silver|platinum|metal|gold/);
  });

  it("handles greetings", () => {
    const reply = stylistReply("hi", ctx);
    expect(reply.toLowerCase()).toContain("stylist");
  });
});

describe("photo validation", () => {
  it("accepts plausible skin-tone portrait stats", () => {
    const stats = {
      centerRgb: { r: 210, g: 150, b: 110 },
      edgeRgb: { r: 90, g: 70, b: 55 },
      luminanceVariance: 22,
      pixelCount: 4096,
    };
    const result = validatePhotoForAnalysis(stats);
    expect(result.ok).toBe(true);
  });

  it("rejects blue sky photos", () => {
    const stats = {
      centerRgb: { r: 110, g: 160, b: 230 },
      edgeRgb: { r: 100, g: 150, b: 220 },
      luminanceVariance: 18,
      pixelCount: 4096,
    };
    const result = validatePhotoForAnalysis(stats);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("not_human");
  });

  it("rejects flat uniform images", () => {
    const stats = {
      centerRgb: { r: 128, g: 128, b: 128 },
      edgeRgb: { r: 128, g: 128, b: 128 },
      luminanceVariance: 1,
      pixelCount: 4096,
    };
    const result = validatePhotoForAnalysis(stats);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("too_uniform");
  });

  it("validates lab samples on the server", () => {
    const skin = srgbToLab(210, 150, 110);
    expect(validateLabSamplesForAnalysis([skin]).ok).toBe(true);
    expect(validateLabSamplesForAnalysis([{ L: 10, a: 0, b: 0 }]).ok).toBe(false);
  });
});

describe("style quiz", () => {
  const analysis = matchSeason([srgbToLab(210, 150, 110)], {
    faceShape: "oval",
    bodyType: "balanced",
  });

  const completeAnswers = {
    primaryGoal: "polished",
    occasions: ["office", "interview"],
    formalFocus: "suits",
    fitPreference: "classic",
    helpAreas: ["suits", "shirts"],
    budget: "invest",
  };

  it("has six engaging questions", () => {
    expect(STYLE_QUIZ_QUESTIONS).toHaveLength(6);
    expect(STYLE_QUIZ_QUESTIONS[0]?.options.length).toBeGreaterThan(2);
  });

  it("detects incomplete answers", () => {
    expect(isStyleQuizComplete(emptyStyleQuizAnswers())).toBe(false);
    expect(isStyleQuizComplete(completeAnswers)).toBe(true);
  });

  it("builds personalized suit and outfit plan", () => {
    const result = buildStyleQuizResult(analysis, completeAnswers);
    expect(result.headline.length).toBeGreaterThan(10);
    expect(result.suitPicks.length).toBeGreaterThan(0);
    expect(result.outfitIdeas.length).toBeGreaterThan(0);
    expect(result.shoppingList.length).toBeGreaterThan(0);
    expect(result.suitPicks[0]?.detail.toLowerCase()).toMatch(/suit|blazer|neutral/);
  });
});
