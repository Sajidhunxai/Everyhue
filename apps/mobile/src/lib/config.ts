export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
