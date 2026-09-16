import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDbUser, parseSavedAnalysis, mergeHistoryJson } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const PHOTO_PREFIX = /^data:image\/(jpeg|jpg|png|webp);base64,/i;

const patchSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(80).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  profileId: z.string().nullable().optional(),
  photoDataUrl: z
    .string()
    .max(900_000)
    .nullable()
    .optional()
    .refine((value) => value == null || value === "" || PHOTO_PREFIX.test(value), "Invalid photo"),
});

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const row = await prisma.analysis.findFirst({ where: { id, userId: user.id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(parseSavedAnalysis(row, { includePhoto: true }));
  }

  const rows = await prisma.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return NextResponse.json(rows.map((row) => parseSavedAnalysis(row)));
}

export async function PATCH(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const row = await prisma.analysis.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let profileId = row.profileId;
  if (parsed.data.profileId !== undefined) {
    if (parsed.data.profileId) {
      const owned = await prisma.familyProfile.findFirst({
        where: { id: parsed.data.profileId, userId: user.id },
      });
      if (!owned) return NextResponse.json({ error: "Invalid family profile" }, { status: 400 });
      profileId = owned.id;
    } else {
      profileId = null;
    }
  }

  const resultJson =
    parsed.data.title !== undefined || parsed.data.notes !== undefined || parsed.data.photoDataUrl !== undefined
      ? mergeHistoryJson(row.resultJson, {
          title: parsed.data.title,
          notes: parsed.data.notes,
          photoDataUrl: parsed.data.photoDataUrl,
        })
      : row.resultJson;

  const updated = await prisma.analysis.update({
    where: { id: row.id },
    data: { resultJson, profileId },
  });

  return NextResponse.json(parseSavedAnalysis(updated));
}

export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const idsParam = url.searchParams.get("ids");
  const ids = id ? [id] : idsParam ? idsParam.split(",").map((v) => v.trim()).filter(Boolean) : [];
  if (!ids.length) return NextResponse.json({ error: "id required" }, { status: 400 });

  const result = await prisma.analysis.deleteMany({
    where: { userId: user.id, id: { in: ids.slice(0, 80) } },
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}
