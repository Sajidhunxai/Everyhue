import { NextResponse } from "next/server";
import { z } from "zod";
import { matchSeason, stubSamplesFromAverageRgb, validateLabSamplesForAnalysis } from "@photomatcher/color-engine";
import { rateLimit } from "@/lib/rate-limit";
import { requireDbUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const labSchema = z.object({
  L: z.number(),
  a: z.number(),
  b: z.number(),
});

const jsonSchema = z.object({
  mode: z.literal("lab"),
  samples: z.array(labSchema).min(1).max(64),
  faceShape: z
    .enum(["oval", "round", "square", "heart", "oblong", "diamond"])
    .optional(),
  bodyType: z
    .enum([
      "balanced",
      "pear",
      "apple",
      "hourglass",
      "rectangle",
      "inverted_triangle",
    ])
    .optional(),
  profileId: z.string().optional(),
  photoDataUrl: z
    .string()
    .max(900_000)
    .optional()
    .refine((value) => !value || /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value), "Invalid photo"),
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`analyze:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await requireDbUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  try {
    let result;
    let faceShape: string | undefined;
    let bodyType: string | undefined;
    let profileId: string | undefined;
    let photoDataUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("image");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "image file required" }, { status: 400 });
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Only JPEG, PNG, or WebP" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
      }
      faceShape = (form.get("faceShape") as string) || undefined;
      bodyType = (form.get("bodyType") as string) || undefined;
      profileId = (form.get("profileId") as string) || undefined;
      await file.arrayBuffer();
      const samples = stubSamplesFromAverageRgb(210, 160, 130);
      result = matchSeason(samples, {
        faceShape: faceShape as never,
        bodyType: bodyType as never,
      });
    } else {
      const body = await req.json();
      const parsed = jsonSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      faceShape = parsed.data.faceShape;
      bodyType = parsed.data.bodyType;
      profileId = parsed.data.profileId;
      photoDataUrl = parsed.data.photoDataUrl;

      const photoCheck = validateLabSamplesForAnalysis(parsed.data.samples);
      if (!photoCheck.ok) {
        return NextResponse.json({ error: photoCheck.message }, { status: 422 });
      }

      result = matchSeason(parsed.data.samples, {
        faceShape: parsed.data.faceShape,
        bodyType: parsed.data.bodyType,
      });
    }

    const { averageLab: _avg, ...publicResult } = result;

    if (profileId) {
      const owned = await prisma.familyProfile.findFirst({
        where: { id: profileId, userId: user.id },
      });
      if (!owned) {
        return NextResponse.json(
          { error: "Invalid family profile" },
          { status: 400 },
        );
      }
    }

    const saved = await prisma.analysis.create({
      data: {
        userId: user.id,
        profileId: profileId ?? null,
        resultJson: JSON.stringify(
          photoDataUrl ? { ...publicResult, historyPhoto: photoDataUrl } : publicResult,
        ),
        faceShape: faceShape ?? null,
        bodyType: bodyType ?? null,
      },
    });

    return NextResponse.json({ ...publicResult, analysisId: saved.id, hasPhoto: Boolean(photoDataUrl) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyze failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
