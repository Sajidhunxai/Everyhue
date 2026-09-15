import { NextResponse } from "next/server";
import { z } from "zod";
import { comparePhotos } from "@photomatcher/color-engine";
import { rateLimit } from "@/lib/rate-limit";
import { requireDbUser } from "@/lib/auth-user";

const photoSchema = z.object({
  label: z.string().min(1),
  samples: z
    .array(z.object({ L: z.number(), a: z.number(), b: z.number() }))
    .min(1)
    .max(64),
});

const schema = z.object({
  photoA: photoSchema,
  photoB: photoSchema,
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`compare:${ip}`, 15, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = comparePhotos(parsed.data.photoA, parsed.data.photoB);
  return NextResponse.json(result);
}
