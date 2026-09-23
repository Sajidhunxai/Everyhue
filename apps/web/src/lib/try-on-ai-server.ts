import type { TryOnFeature, TryOnLook } from "@photomatcher/types";

export type TryOnEnabled = Record<TryOnFeature, boolean>;

function hexName(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

export function buildTryOnPrompt(look: TryOnLook, enabled: TryOnEnabled) {
  const parts: string[] = [
    "Photorealistic virtual try-on of THIS exact person.",
    "Keep the same identity, face, pose, body, background, lighting, and camera.",
    "Do not add a color filter, vintage look, or overlay on the whole photo.",
    "Do not change skin tone except requested blush.",
    "Only recolor the requested regions so they look like real dye, makeup, or fabric.",
  ];

  if (enabled.hair) {
    parts.push(
      `Recolor every visible hair strand (roots, mid-lengths, ends, flyaways) to #${hexName(look.hair)}. Keep natural shine and texture.`,
    );
  }
  if (enabled.eyes) {
    parts.push(
      `Recolor both irises to #${hexName(look.eyes)}. Keep pupils, catchlights, and white sclera unchanged.`,
    );
  }
  if (enabled.lips) {
    parts.push(
      `Apply natural lipstick in #${hexName(look.lips)} on the lips only. Keep lip texture and lighting.`,
    );
  }
  if (enabled.cheeks) {
    parts.push(`Add soft natural blush in #${hexName(look.cheeks)} only on the apples of the cheeks.`);
  }
  if (enabled.jewelry) {
    parts.push(`Recolor visible jewelry and metal to #${hexName(look.jewelry)}.`);
  }
  if (enabled.dress) {
    parts.push(
      `Recolor clothing fabric (shirt, dress, or top) to #${hexName(look.dress)}. Keep folds and texture.`,
    );
  }

  parts.push("Output a realistic edited photograph, not an illustration.");
  return parts.join(" ");
}

function extractGeminiImage(payload: unknown): string | null {
  const root = payload as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const part = root.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const data = part?.inlineData?.data;
  const mime = part?.inlineData?.mimeType || "image/png";
  return data ? `data:${mime};base64,${data}` : null;
}

export async function renderTryOnWithGemini(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
  apiKey: string,
) {
  const models = ["gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation"];
  const prompt = buildTryOnPrompt(look, enabled);
  const b64 = Buffer.from(imageBytes).toString("base64");

  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: b64 } },
              ],
            },
          ],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      },
    );
    if (!res.ok) continue;
    const image = extractGeminiImage(await res.json());
    if (image) return image;
  }
  return null;
}

export async function renderTryOnWithOpenAi(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
  apiKey: string,
) {
  const prompt = buildTryOnPrompt(look, enabled);
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const form = new FormData();
  form.set("model", "gpt-image-1");
  form.set("prompt", prompt);
  form.set("size", "1024x1024");
  form.append(
    "image",
    new Blob([Buffer.from(imageBytes)], { type: mimeType }),
    `portrait.${ext}`,
  );

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  return data.data?.[0]?.url ?? null;
}

export async function renderTryOnAi(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
) {
  const gemini = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();

  if (gemini) {
    const image = await renderTryOnWithGemini(imageBytes, mimeType, look, enabled, gemini);
    if (image) return image;
  }
  if (openai) {
    const image = await renderTryOnWithOpenAi(imageBytes, mimeType, look, enabled, openai);
    if (image) return image;
  }
  return null;
}
