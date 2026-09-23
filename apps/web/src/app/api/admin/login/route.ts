import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminEmail,
  ensureAdminUser,
  signAdminToken,
} from "@/lib/admin";
import { verifyPassword } from "@/lib/password";

const bodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`admin-login:${ip}`, 12, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 400 });
  }

  const admin = await ensureAdminUser();
  const email = (parsed.data.email || adminEmail()).trim().toLowerCase();
  if (email !== adminEmail()) {
    return NextResponse.json({ error: "Invalid admin login." }, { status: 401 });
  }
  if (!admin.passwordHash || !verifyPassword(parsed.data.password, admin.passwordHash)) {
    return NextResponse.json({ error: "Invalid admin login." }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    user: { id: admin.id, email: admin.email, name: admin.name },
  });
  res.cookies.set(ADMIN_COOKIE, signAdminToken(admin.id), adminCookieOptions());
  return res;
}
