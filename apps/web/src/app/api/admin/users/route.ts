import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail, requireAdmin } from "@/lib/admin";
import { hashPassword, normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
});

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      _count: { select: { analyses: true, wardrobe: true } },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
      isAdmin: isAdminEmail(u.email),
      analyses: u._count.analyses,
      wardrobe: u._count.wardrobe,
    })),
  );
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Need name, email, and an 8+ character password." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const exists = await prisma.user.findFirst({ where: { email } });
  if (exists) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      id: `email:${email}`,
      email,
      name: parsed.data.name,
      passwordHash: hashPassword(parsed.data.password),
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    isAdmin: false,
    analyses: 0,
    wardrobe: 0,
  });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: "You cannot delete the admin account." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (user && isAdminEmail(user.email)) {
    return NextResponse.json({ error: "You cannot delete the admin account." }, { status: 400 });
  }

  await prisma.user.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
