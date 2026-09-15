import type { StylistContext } from "@photomatcher/types";
import { getApiBaseUrl } from "@/lib/config";

export type ChatMessage = { role: "user" | "assistant"; content: string; createdAt?: string };

export async function loadStylistHistory(accessToken: string): Promise<ChatMessage[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/stylist`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<ChatMessage[]>;
}

export async function askStylist(
  accessToken: string,
  message: string,
  context: StylistContext,
): Promise<{ reply: string; mode?: "ai" | "rules" }> {
  const res = await fetch(`${getApiBaseUrl()}/api/stylist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ reply: string; mode?: "ai" | "rules" }>;
}
