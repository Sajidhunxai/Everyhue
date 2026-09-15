import { analyzeLab } from "@photomatcher/api-client";
import type { AnalyzeResult, BodyType, FaceShape } from "@photomatcher/types";

export async function analyzeWithOptions(
  accessToken: string,
  samples: { L: number; a: number; b: number }[],
  options?: { faceShape?: FaceShape; bodyType?: BodyType; profileId?: string },
): Promise<AnalyzeResult> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ mode: "lab", samples, ...options }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<AnalyzeResult>;
}
