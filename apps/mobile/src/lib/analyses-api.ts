import type { SavedAnalysis } from "@photomatcher/types";
import { getApiBaseUrl } from "@/lib/config";

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function listAnalyses(token: string): Promise<SavedAnalysis[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/analyses`, { headers: headers(token) });
  if (!res.ok) throw new Error("Could not load history");
  return res.json() as Promise<SavedAnalysis[]>;
}

export async function getAnalysis(token: string, id: string): Promise<SavedAnalysis> {
  const res = await fetch(`${getApiBaseUrl()}/api/analyses?id=${encodeURIComponent(id)}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Could not open that analysis");
  return res.json() as Promise<SavedAnalysis>;
}

export async function deleteAnalysis(token: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/analyses?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Could not delete");
}
