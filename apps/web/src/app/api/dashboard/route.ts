import { NextResponse } from "next/server";
import { requireDbUser, parseAnalysisJson } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [analysisCount, wardrobeCount, profileCount, latest] = await Promise.all([
    prisma.analysis.count({ where: { userId: user.id } }),
    prisma.wardrobeItem.count({ where: { userId: user.id } }),
    prisma.familyProfile.count({ where: { userId: user.id } }),
    prisma.analysis.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latestSeason = latest
    ? parseAnalysisJson(latest.resultJson).seasonLabel
    : null;

  return NextResponse.json({
    analysisCount,
    wardrobeCount,
    profileCount,
    latestSeason,
  });
}
