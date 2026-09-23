import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDbUser } from "@/lib/auth-user";
import { rateLimit } from "@/lib/rate-limit";
import { renderTryOnAi } from "@/lib/try-on-ai-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const lookSchema = z.object({
  hair: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  eyes: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  lips: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  cheeks: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  jewelry: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  dress: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  skin: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
});

const enabledSchema = z.object({
  hair: z.boolean(),
  eyes: z.boolean(),
  lips: z.boolean(),
  cheeks: z.boolean(),
  jewelry: z.boolean(),
  dress: z.boolean(),
});

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function normalizeHex(hex: string) {
  return hex.startsWith("#") ? hex : `#${hex}`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Look studio is live. The phone app posts a photo here — opening this URL in a browser is not a try-on.",
  });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`try-on:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many look-studio requests. Wait a moment." }, { status: 429 });
  }

  const user = await requireDbUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A portrait photo is required" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a JPEG or PNG portrait" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 4MB)" }, { status: 400 });
  }

  const lookRaw = form.get("look");
  const enabledRaw = form.get("enabled");
  let lookJson: unknown = lookRaw;
  let enabledJson: unknown = enabledRaw;
  try {
    if (typeof lookRaw === "string") lookJson = JSON.parse(lookRaw);
    if (typeof enabledRaw === "string") enabledJson = JSON.parse(enabledRaw);
  } catch {
    return NextResponse.json({ error: "Invalid look colors" }, { status: 400 });
  }
  const lookParsed = lookSchema.safeParse(lookJson);
  const enabledParsed = enabledSchema.safeParse(enabledJson);
  if (!lookParsed.success || !enabledParsed.success) {
    return NextResponse.json({ error: "Invalid look colors" }, { status: 400 });
  }

  const look = {
    hair: normalizeHex(lookParsed.data.hair),
    eyes: normalizeHex(lookParsed.data.eyes),
    lips: normalizeHex(lookParsed.data.lips),
    cheeks: normalizeHex(lookParsed.data.cheeks),
    jewelry: normalizeHex(lookParsed.data.jewelry),
    dress: normalizeHex(lookParsed.data.dress),
    skin: normalizeHex(lookParsed.data.skin ?? lookParsed.data.cheeks),
  };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = await renderTryOnAi(bytes, file.type || "image/jpeg", look, enabledParsed.data);
  if (!image) {
    return NextResponse.json(
      { error: "AI look studio is not available right now. Try again in a moment." },
      { status: 503 },
    );
  }

  return NextResponse.json({ image });
}
