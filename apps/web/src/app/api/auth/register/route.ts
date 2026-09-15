import { NextResponse } from "next/server";
import { z } from "zod";
import { signMobileToken } from "@/lib/mobile-token";
import { hashPassword, normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`auth-register:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Server AUTH_SECRET is not configured" },
      { status: 500 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.user.findFirst({
    where: { email, passwordHash: { not: null } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 },
    );
  }

  // Prefer updating an OAuth user who signed up with the same email and no password yet.
  const oauthSameEmail = await prisma.user.findFirst({
    where: { email, passwordHash: null },
  });

  const name = parsed.data.name?.trim() || email.split("@")[0] || "Every Hue user";
  const passwordHash = hashPassword(parsed.data.password);

  const user = oauthSameEmail
    ? await prisma.user.update({
        where: { id: oauthSameEmail.id },
        data: { passwordHash, name: oauthSameEmail.name || name },
      })
    : await prisma.user.create({
        data: {
          id: `email:${email}`,
          email,
          name,
          passwordHash,
        },
      });

  const accessToken = signMobileToken({
    sub: user.id,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    picture: user.image ?? undefined,
    provider: "email",
  });

  return NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  });
}
