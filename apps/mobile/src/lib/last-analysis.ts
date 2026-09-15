import type { AnalyzeResult } from "@photomatcher/types";
import * as SecureStore from "expo-secure-store";

const KEY = "photomatcher.lastResult";

export async function saveLastAnalysis(result: AnalyzeResult): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(result));
}

export async function loadLastAnalysis(): Promise<AnalyzeResult | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalyzeResult;
  } catch {
    return null;
  }
}

export function stylistContextFromResult(result: AnalyzeResult) {
  return {
    seasonLabel: result.seasonLabel,
    undertone: result.undertone,
    palette: result.palette.slice(0, 6).map((s) => ({ hex: s.hex, name: s.name })),
    neutrals: result.styleGuide?.neutrals ?? [],
  };
}
