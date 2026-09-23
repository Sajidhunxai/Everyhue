import type { AnalyzeResult, BodyType, FaceShape } from "@photomatcher/types";
import { getApiBaseUrl } from "@/lib/config";

export async function analyzeWithOptions(
  accessToken: string,
  samples: { L: number; a: number; b: number }[],
  options?: { faceShape?: FaceShape; bodyType?: BodyType; profileId?: string },
): Promise<AnalyzeResult> {
  const res = await fetch(`${getApiBaseUrl()}/api/analyze`, {
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
