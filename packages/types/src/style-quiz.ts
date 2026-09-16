import type { AnalyzeResult } from "./index";

export type StyleQuizAnswers = {
  primaryGoal: string;
  occasions: string[];
  formalFocus: string;
  fitPreference: string;
  helpAreas: string[];
  budget: string;
};

export type StyleQuizOption = {
  value: string;
  label: string;
  emoji: string;
  desc?: string;
};

export type StyleQuizQuestion = {
  id: keyof StyleQuizAnswers;
  title: string;
  subtitle: string;
  multi?: boolean;
  options: StyleQuizOption[];
};

export type StyleQuizOutfit = {
  occasion: string;
  title: string;
  detail: string;
  colors: string[];
};

export type StyleQuizResult = {
  headline: string;
  summary: string;
  stylePersonality: string;
  suitPicks: { title: string; detail: string; priority: "essential" | "recommended" | "optional" }[];
  outfitIdeas: StyleQuizOutfit[];
  shoppingList: { item: string; why: string }[];
  groomingTips: string[];
  nextSteps: string[];
};

export type StyleQuizPayload = {
  id?: string;
  quizTitle?: string;
  templateId?: string;
  answers: StyleQuizAnswers | Record<string, string | string[]>;
  result: StyleQuizResult;
  seasonLabel: string;
  completedAt: string;
};

export type CustomQuizOption = {
  value: string;
  label: string;
  emoji?: string;
  desc?: string;
};

export type CustomQuizQuestion = {
  id: string;
  title: string;
  subtitle: string;
  multi?: boolean;
  options: CustomQuizOption[];
};

export type QuizTemplate = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  questions: CustomQuizQuestion[];
  resultTitle: string;
  resultBody: string;
  createdAt: string;
};
