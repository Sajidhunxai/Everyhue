import type { SavedLook, WardrobeItem } from "@photomatcher/types";
import { getApiBaseUrl } from "@/lib/config";

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function listLooks(token: string): Promise<SavedLook[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/looks`, { headers: headers(token) });
  if (!res.ok) throw new Error("Could not load looks");
  return res.json() as Promise<SavedLook[]>;
}

export async function listWardrobe(token: string): Promise<WardrobeItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/wardrobe`, { headers: headers(token) });
  if (!res.ok) throw new Error("Could not load wardrobe");
  return res.json() as Promise<WardrobeItem[]>;
}

export async function createLook(
  token: string,
  body: { name: string; occasion: string; itemIds: string[] },
): Promise<SavedLook> {
  const res = await fetch(`${getApiBaseUrl()}/api/looks`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Could not save look");
  }
  return res.json() as Promise<SavedLook>;
}

export async function deleteLook(token: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/looks?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Could not delete look");
}
