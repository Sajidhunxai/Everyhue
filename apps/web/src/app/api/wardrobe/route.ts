import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDbUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  notes: z.string().max(200).optional(),
});

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.wardrobeItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      hex: i.hex,
      name: i.name,
      category: i.category,
      notes: i.notes,
      createdAt: i.createdAt.toISOString(),
    })),
  );
}

export async function POST(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.wardrobeItem.create({
    data: { userId: user.id, ...parsed.data },
  });
  return NextResponse.json({
    id: item.id,
    hex: item.hex,
    name: item.name,
    category: item.category,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
  });
}

export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.wardrobeItem.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
