export type DashboardStats = {
  analysisCount: number;
  wardrobeCount: number;
  profileCount: number;
  latestSeason: string | null;
};

export async function fetchDashboardStats(accessToken: string): Promise<DashboardStats> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/dashboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<DashboardStats>;
}
