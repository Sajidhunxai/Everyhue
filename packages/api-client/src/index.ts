import type { AnalyzeResult, LabColor } from "@photomatcher/types";

export type AnalyzeLabPayload = {
  mode: "lab";
  samples: LabColor[];
};

export async function analyzeLab(
  baseUrl: string,
  payload: AnalyzeLabPayload,
  options?: { accessToken?: string },
): Promise<AnalyzeResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Analyze failed (${res.status})`);
  }

  return res.json() as Promise<AnalyzeResult>;
}
