import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [users, analyses] = await Promise.all([
    prisma.user.count(),
    prisma.analysis.count(),
  ]);
  let quizzes = 0;
  let templates = 0;
  try {
    quizzes = await (prisma as unknown as { savedQuiz: { count: () => Promise<number> } }).savedQuiz.count();
  } catch {
    quizzes = 0;
  }
  try {
    templates = await (prisma as unknown as { quizTemplate: { count: () => Promise<number> } }).quizTemplate.count();
  } catch {
    templates = 0;
  }

  return NextResponse.json({ users, analyses, quizzes, templates });
}
