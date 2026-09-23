import { getApiBaseUrl } from "@/lib/config";

export type DashboardStats = {
  analysisCount: number;
  wardrobeCount: number;
  profileCount: number;
  latestSeason: string | null;
};

export async function fetchDashboardStats(accessToken: string): Promise<DashboardStats> {
  const res = await fetch(`${getApiBaseUrl()}/api/dashboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<DashboardStats>;
}
