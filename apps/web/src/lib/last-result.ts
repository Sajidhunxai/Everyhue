import type { AnalyzeResult } from "@photomatcher/types";

export const LAST_RESULT_KEY = "photomatcher:lastResult";

export function loadLastResult(): AnalyzeResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LAST_RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalyzeResult;
  } catch {
    return null;
  }
}

export function saveLastResult(result: AnalyzeResult) {
  sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
}
