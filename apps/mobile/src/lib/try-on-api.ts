import type { TryOnLook } from "@photomatcher/types";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { getApiBaseUrl } from "@/lib/config";
import type { TryOnEnabled } from "@/lib/try-on-render";

export async function renderLookWithAi(
  accessToken: string,
  photoUri: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
): Promise<string> {
  const prepared = await ImageManipulator.manipulateAsync(
    photoUri.split("?")[0],
    [{ resize: { width: 768 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );

  const form = new FormData();
  form.append("image", {
    uri: prepared.uri,
    name: "portrait.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  form.append("look", JSON.stringify(look));
  form.append("enabled", JSON.stringify(enabled));

  const res = await fetch(`${getApiBaseUrl()}/api/try-on`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  const payload = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
  if (!res.ok || !payload.image) {
    throw new Error(payload.error || "Could not apply the AI look");
  }

  const match = payload.image.match(/^data:image\/\w+;base64,(.+)$/);
  const dest = `${FileSystem.cacheDirectory}everyhue-ai-tryon.jpg`;
  if (match) {
    await FileSystem.writeAsStringAsync(dest, match[1], {
      encoding: FileSystem.EncodingType.Base64,
    });
    return dest;
  }
  return payload.image;
}
