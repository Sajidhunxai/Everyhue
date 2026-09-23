import Constants from "expo-constants";

const PRODUCTION_API = "https://www.asktheimageguru.com";

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const extra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (extra?.trim()) return extra.replace(/\/$/, "");
  return PRODUCTION_API;
}
