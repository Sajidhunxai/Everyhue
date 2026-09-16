import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE = "eh_admin";

export function adminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || "admin@everyhue.app");
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "Login1122@";
}

export async function ensureAdminUser() {
  const email = adminEmail();
  const passwordHash = hashPassword(adminPassword());
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    if (!existing.passwordHash || !verifyPassword(adminPassword(), existing.passwordHash)) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: existing.name || "Admin" },
      });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      id: `email:${email}`,
      email,
      name: "Admin",
      passwordHash,
    },
  });
}

export function isAdminEmail(email: string | null | undefined) {
  return normalizeEmail(email || "") === adminEmail();
}

function secret() {
  return process.env.AUTH_SECRET || "every-hue-admin-dev-secret";
}

export function signAdminToken(userId: string) {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const id = Buffer.from(userId).toString("base64url");
  const payload = `${id}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null) {
  if (!token) return null;
  let raw = token.trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* already decoded */
  }
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [idPart, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!idPart || !sig || !Number.isFinite(exp) || exp < Date.now()) return null;
  const payload = `${idPart}.${expRaw}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(idPart, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function tokenFromCookieHeader(header: string | null) {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match?.[1] ? match[1] : null;
}

export async function requireAdmin(req?: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value || tokenFromCookieHeader(req?.headers.get("cookie") ?? null);
  const userId = verifyAdminToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
  };
}
