import type { StyleQuizPayload } from "@photomatcher/types";

const LEGACY_KEY = "photomatcher:styleQuiz";
const HISTORY_KEY = "photomatcher:styleQuizHistory";

function parseList(raw: string | null): StyleQuizPayload[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as StyleQuizPayload | StyleQuizPayload[];
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
}

export function loadLocalQuizHistory(): StyleQuizPayload[] {
  if (typeof window === "undefined") return [];
  const history = parseList(localStorage.getItem(HISTORY_KEY));
  const legacy = parseList(sessionStorage.getItem(LEGACY_KEY));
  const merged = [...history];
  for (const item of legacy) {
    if (!merged.some((row) => row.completedAt === item.completedAt && row.result.headline === item.result.headline)) {
      merged.push(item);
    }
  }
  return merged
    .filter((row) => row?.result?.headline && row.completedAt)
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
    .slice(0, 30);
}

export function saveLocalQuizHistory(rows: StyleQuizPayload[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, 30)));
}

export function addLocalQuiz(payload: StyleQuizPayload) {
  const next = [payload, ...loadLocalQuizHistory().filter((row) => row.id !== payload.id)].slice(0, 30);
  saveLocalQuizHistory(next);
  return next;
}

export function removeLocalQuiz(id: string) {
  const next = loadLocalQuizHistory().filter((row) => row.id !== id);
  saveLocalQuizHistory(next);
  return next;
}

export function mergeQuizHistory(remote: StyleQuizPayload[], local: StyleQuizPayload[]) {
  const byId = new Map<string, StyleQuizPayload>();
  for (const row of [...remote, ...local]) {
    const key = row.id || `${row.completedAt}:${row.result.headline}`;
    if (!byId.has(key)) byId.set(key, { ...row, id: row.id || key });
  }
  return [...byId.values()].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
}
