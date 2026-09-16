import type { AnalyzeResult } from "@photomatcher/types";

export const LAST_RESULT_KEY = "photomatcher:lastResult";
const LAST_PHOTO_KEY = "photomatcher:lastPhoto";
const LAST_ANALYSIS_ID_KEY = "photomatcher:lastAnalysisId";

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

export function loadLastAnalysisId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(LAST_ANALYSIS_ID_KEY) ?? localStorage.getItem(LAST_ANALYSIS_ID_KEY);
}

export function saveLastAnalysisId(id: string | null) {
  if (id) {
    sessionStorage.setItem(LAST_ANALYSIS_ID_KEY, id);
    localStorage.setItem(LAST_ANALYSIS_ID_KEY, id);
  } else {
    sessionStorage.removeItem(LAST_ANALYSIS_ID_KEY);
    localStorage.removeItem(LAST_ANALYSIS_ID_KEY);
  }
}

export function loadLastPhoto(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(LAST_PHOTO_KEY) ?? localStorage.getItem(LAST_PHOTO_KEY);
}

export function saveLastPhoto(dataUrl: string | null) {
  if (!dataUrl) {
    sessionStorage.removeItem(LAST_PHOTO_KEY);
    localStorage.removeItem(LAST_PHOTO_KEY);
    return;
  }
  try {
    sessionStorage.setItem(LAST_PHOTO_KEY, dataUrl);
  } catch {
    sessionStorage.removeItem(LAST_PHOTO_KEY);
  }
  try {
    localStorage.setItem(LAST_PHOTO_KEY, dataUrl);
  } catch {
    localStorage.removeItem(LAST_PHOTO_KEY);
  }
}

export async function fileToPortraitDataUrl(file: File, max = 720, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process that photo");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function persistAnalysisPhoto(analysisId: string | null, dataUrl: string) {
  saveLastPhoto(dataUrl);
  if (!analysisId) return;
  await fetch("/api/analyses", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: analysisId, photoDataUrl: dataUrl }),
  });
}
