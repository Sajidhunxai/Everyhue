import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreLookAgainstPalette } from "@photomatcher/color-engine";
import { requireDbUser, parseAnalysisJson } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const OCCASIONS = [
  "Everyday",
  "Work",
  "Interview",
  "Date",
  "Wedding",
  "Travel",
  "Formal",
  "Casual",
] as const;

const createSchema = z.object({
  name: z.string().min(1).max(80),
  occasion: z.enum(OCCASIONS).or(z.string().min(1).max(40)),
  itemIds: z.array(z.string()).min(1).max(8),
});

function parseLook(row: {
  id: string;
  name: string;
  occasion: string;
  hexes: string;
  itemIds: string;
  score: number | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    occasion: row.occasion,
    hexes: JSON.parse(row.hexes) as string[],
    itemIds: JSON.parse(row.itemIds) as string[],
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const looks = await prisma.savedLook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(looks.map(parseLook));
}

export async function POST(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a name, occasion, and at least one wardrobe item." }, { status: 400 });
  }

  const items = await prisma.wardrobeItem.findMany({
    where: { userId: user.id, id: { in: parsed.data.itemIds } },
  });
  if (!items.length) {
    return NextResponse.json({ error: "Those wardrobe items were not found." }, { status: 400 });
  }

  const hexes = items.map((item) => item.hex);
  const latest = await prisma.analysis.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const analysis = latest ? parseAnalysisJson(latest.resultJson) : null;
  const score = analysis
    ? scoreLookAgainstPalette(hexes, analysis.palette, analysis.avoid)
    : null;

  const look = await prisma.savedLook.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      occasion: parsed.data.occasion,
      hexes: JSON.stringify(hexes),
      itemIds: JSON.stringify(items.map((item) => item.id)),
      score,
    },
  });

  return NextResponse.json(parseLook(look));
}

export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.savedLook.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
