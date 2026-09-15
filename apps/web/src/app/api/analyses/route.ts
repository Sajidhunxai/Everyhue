import { NextResponse } from "next/server";
import { requireDbUser, parseAnalysisJson } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      profileId: r.profileId,
      faceShape: r.faceShape,
      bodyType: r.bodyType,
      result: parseAnalysisJson(r.resultJson),
      createdAt: r.createdAt.toISOString(),
    })),
  );
}
