import { NextResponse } from "next/server";
import { z } from "zod";
import {
  signMobileToken,
  verifyFacebookAccessToken,
  verifyGoogleAccessToken,
  verifyGoogleIdToken,
} from "@/lib/mobile-token";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z
  .object({
    provider: z.enum(["google", "facebook"]),
    accessToken: z.string().min(10).optional(),
    idToken: z.string().min(10).optional(),
  })
  .refine((data) => data.accessToken || data.idToken, {
    message: "accessToken or idToken is required",
  });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`mobile-auth:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { provider, accessToken, idToken } = parsed.data;
  const profile =
    provider === "google"
      ? idToken
        ? await verifyGoogleIdToken(idToken)
        : accessToken
          ? await verifyGoogleAccessToken(accessToken)
          : null
      : accessToken
        ? await verifyFacebookAccessToken(accessToken)
        : null;

  if (!profile) {
    return NextResponse.json({ error: "Invalid provider token" }, { status: 401 });
  }

  if (!process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Server AUTH_SECRET is not configured" },
      { status: 500 },
    );
  }

  const token = signMobileToken({
    sub: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    provider,
  });

  return NextResponse.json({
    accessToken: token,
    user: {
      id: profile.sub,
      email: profile.email ?? null,
      name: profile.name ?? null,
      image: profile.picture ?? null,
    },
  });
}
