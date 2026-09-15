import { NextResponse } from "next/server";
import { z } from "zod";
import { signMobileToken } from "@/lib/mobile-token";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`auth-login:${ip}`, 20, 60_000);
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
      { error: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findFirst({
    where: { email, passwordHash: { not: null } },
  });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

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
