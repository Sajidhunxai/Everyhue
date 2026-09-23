import type { TryOnFeature, TryOnLook } from "@photomatcher/types";
import { renderTryOnLocal } from "@/lib/try-on-local";

export type TryOnEnabled = Record<TryOnFeature, boolean>;

export class TryOnAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TryOnAiError";
  }
}

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

function openaiMessage(payload: unknown, status: number) {
  const body = payload as {
    error?: { message?: string; code?: string; type?: string };
    message?: string;
  };
  const text = body.error?.message || body.message || `OpenAI image edit failed (${status})`;
  if (/verif/i.test(text) || /organization/i.test(text)) {
    return "OpenAI image models need organization verification. Open platform.openai.com → Settings → Organization → Verify.";
  }
  if (/invalid.?api.?key|incorrect api key|authentication/i.test(text)) {
    return "OpenAI rejected the API key. Check OPENAI_API_KEY on Vercel and redeploy.";
  }
  if (/quota|billing|insufficient/i.test(text)) {
    return "OpenAI billing or quota blocked image edits. Add credit on platform.openai.com.";
  }
  if (/model/i.test(text) && /not found|does not exist|not available/i.test(text)) {
    return "This OpenAI account cannot use GPT Image yet. Verify the org or enable gpt-image-1 / gpt-image-1-mini.";
  }
  return text.slice(0, 240);
}

function extractImage(payload: unknown): string | null {
  const data = payload as {
    data?: { b64_json?: string; url?: string }[];
    output?: { type?: string; result?: string; b64_json?: string }[];
  };
  if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  if (data.data?.[0]?.url) return data.data[0].url;
  const part = data.output?.find((item) => item.b64_json || item.result);
  if (part?.b64_json) return `data:image/png;base64,${part.b64_json}`;
  if (part?.result) return `data:image/png;base64,${part.result}`;
  return null;
}

async function editWithMultipart(
  apiKey: string,
  model: string,
  prompt: string,
  imageBytes: Uint8Array,
  mimeType: string,
  fieldName: string,
) {
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const bytes = Uint8Array.from(imageBytes);
  const form = new FormData();
  form.set("model", model);
  form.set("prompt", prompt);
  form.set("size", "1024x1024");
  form.set("quality", "low");
  form.append(fieldName, new Blob([bytes as BlobPart], { type: mimeType }), `portrait.${ext}`);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { image: null as string | null, error: openaiMessage(json, res.status) };
  return { image: extractImage(json), error: null as string | null };
}

async function editWithJson(
  apiKey: string,
  model: string,
  prompt: string,
  imageBytes: Uint8Array,
  mimeType: string,
) {
  const b64 = Buffer.from(imageBytes).toString("base64");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      quality: "low",
      image: `data:${mimeType};base64,${b64}`,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { image: null as string | null, error: openaiMessage(json, res.status) };
  return { image: extractImage(json), error: null as string | null };
}

export async function renderTryOnWithOpenAi(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
  apiKey: string,
) {
  const prompt = buildTryOnPrompt(look, enabled);
  const models = ["gpt-image-1-mini", "gpt-image-1", "gpt-image-1.5"];
  let lastError = "OpenAI could not edit that photo.";

  for (const model of models) {
    const json = await editWithJson(apiKey, model, prompt, imageBytes, mimeType);
    if (json.image) return json.image;
    if (json.error) lastError = json.error;

    const multi = await editWithMultipart(apiKey, model, prompt, imageBytes, mimeType, "image[]");
    if (multi.image) return multi.image;
    if (multi.error) lastError = multi.error;

    const single = await editWithMultipart(apiKey, model, prompt, imageBytes, mimeType, "image");
    if (single.image) return single.image;
    if (single.error) lastError = single.error;
  }

  throw new TryOnAiError(lastError);
}

function geminiMessage(payload: unknown, status: number) {
  const body = payload as { error?: { message?: string; status?: string; code?: number } };
  const statusName = body.error?.status || "";
  const text = body.error?.message || `Gemini image edit failed (${status})`;
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(statusName) || /quota|billing|rate.?limit/i.test(text)) {
    return "Gemini image models need billing on this project. In Google AI Studio open API keys → everyhue → Set up billing, then wait a few minutes and try again.";
  }
  if (/api key|api_key|unauthenticated|permission|forbidden|invalid/i.test(text) && !/not found|not supported/i.test(text)) {
    return "Gemini rejected the API key. Check GEMINI_API_KEY on Vercel and redeploy.";
  }
  if (/not found|not supported|does not exist/i.test(text)) {
    return "Gemini image model is not available on this key yet. Keep the current key and enable billing in AI Studio.";
  }
  return text.slice(0, 240);
}

function preferGeminiError(current: string, next: string) {
  const rank = (msg: string) => {
    if (/need billing|quota|billing/i.test(msg)) return 3;
    if (/rejected the API key/i.test(msg)) return 2;
    if (/not available|not found/i.test(msg)) return 1;
    return 0;
  };
  return rank(next) >= rank(current) ? next : current;
}

function extractGeminiImage(payload: unknown): string | null {
  const root = payload as {
    candidates?: {
      content?: {
        parts?: {
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mime_type?: string };
        }[];
      };
    }[];
  };
  const part = root.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data || p.inline_data?.data);
  const data = part?.inlineData?.data || part?.inline_data?.data;
  const mime = part?.inlineData?.mimeType || part?.inline_data?.mime_type || "image/png";
  return data ? `data:${mime};base64,${data}` : null;
}

export async function renderTryOnWithGemini(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
  apiKey: string,
) {
  const models = [
    "gemini-3.1-flash-image-preview",
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-lite-image",
    "gemini-3-pro-image-preview",
  ];
  const prompt = buildTryOnPrompt(look, enabled);
  const b64 = Buffer.from(imageBytes).toString("base64");
  let lastError = "Gemini could not edit that photo.";

  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
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
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastError = preferGeminiError(lastError, geminiMessage(json, res.status));
      continue;
    }
    const image = extractGeminiImage(json);
    if (image) return image;
    lastError = "Gemini returned no image. Try a clearer face-forward photo.";
  }
  throw new TryOnAiError(lastError);
}

export function tryOnAiProviders() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    local: true,
  };
}

export async function renderTryOnAi(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
) {
  const gemini = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();

  const local = () => renderTryOnLocal(imageBytes, mimeType, look, enabled);

  if (gemini) {
    try {
      return await renderTryOnWithGemini(imageBytes, mimeType, look, enabled, gemini);
    } catch {
      const fallback = local();
      if (fallback) return fallback;
      throw new TryOnAiError("Cloud look failed. Showing the on-device web look needs a JPEG portrait.");
    }
  }

  const fallback = local();
  if (fallback) return fallback;

  if (openai) {
    return renderTryOnWithOpenAi(imageBytes, mimeType, look, enabled, openai);
  }
  throw new TryOnAiError("Could not apply the look. Use a JPEG face photo.");
}
