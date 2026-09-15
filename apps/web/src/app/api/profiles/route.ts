import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDbUser, parseAnalysisJson } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  relation: z.string().min(1).max(40),
});

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await prisma.familyProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(
    profiles.map((p) => ({
      id: p.id,
      name: p.name,
      relation: p.relation,
      createdAt: p.createdAt.toISOString(),
      lastAnalysis: p.analyses[0]
        ? {
            id: p.analyses[0].id,
            result: parseAnalysisJson(p.analyses[0].resultJson),
            createdAt: p.analyses[0].createdAt.toISOString(),
          }
        : null,
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

  const profile = await prisma.familyProfile.create({
    data: { userId: user.id, ...parsed.data },
  });
  return NextResponse.json({
    id: profile.id,
    name: profile.name,
    relation: profile.relation,
    createdAt: profile.createdAt.toISOString(),
    lastAnalysis: null,
  });
}

export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.familyProfile.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
