import type { CompareResult } from "@photomatcher/types";
import type { LabColor } from "@photomatcher/types";
import { getApiBaseUrl } from "@/lib/config";

export async function compareWithApi(
  accessToken: string,
  photoA: { label: string; samples: LabColor[] },
  photoB: { label: string; samples: LabColor[] },
): Promise<CompareResult> {
  const res = await fetch(`${getApiBaseUrl()}/api/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ photoA, photoB }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CompareResult>;
}
