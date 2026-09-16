import { NextResponse } from "next/server";
import { z } from "zod";
import type { StyleQuizPayload } from "@photomatcher/types";
import { requireDbUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

type QuizRow = { id: string; seasonLabel: string; payloadJson: string; createdAt: Date };

function quizTable() {
  return (
    prisma as unknown as {
      savedQuiz: {
        findMany: (args: object) => Promise<QuizRow[]>;
        create: (args: object) => Promise<QuizRow>;
        deleteMany: (args: object) => Promise<unknown>;
      };
    }
  ).savedQuiz;
}

const createSchema = z.object({
  answers: z.object({
    primaryGoal: z.string(),
    occasions: z.array(z.string()),
    formalFocus: z.string(),
    fitPreference: z.string(),
    helpAreas: z.array(z.string()),
    budget: z.string(),
  }),
  result: z.object({
    headline: z.string().min(1).max(200),
    summary: z.string(),
    stylePersonality: z.string(),
    suitPicks: z.array(z.unknown()),
    outfitIdeas: z.array(z.unknown()),
    shoppingList: z.array(z.unknown()),
    groomingTips: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
  seasonLabel: z.string().min(1).max(80),
  completedAt: z.string().optional(),
});

function parseQuiz(row: { id: string; seasonLabel: string; payloadJson: string; createdAt: Date }): StyleQuizPayload {
  const payload = JSON.parse(row.payloadJson) as StyleQuizPayload;
  return {
    ...payload,
    id: row.id,
    seasonLabel: payload.seasonLabel || row.seasonLabel,
    completedAt: payload.completedAt || row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await quizTable().findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(rows.map(parseQuiz));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Could not save quiz" }, { status: 400 });
  }

  const completedAt = parsed.data.completedAt || new Date().toISOString();
  const payload: StyleQuizPayload = {
    answers: parsed.data.answers,
    result: parsed.data.result as StyleQuizPayload["result"],
    seasonLabel: parsed.data.seasonLabel,
    completedAt,
  };

  try {
    const row = await quizTable().create({
      data: {
        userId: user.id,
        seasonLabel: payload.seasonLabel,
        headline: payload.result.headline,
        payloadJson: JSON.stringify(payload),
      },
    });
    return NextResponse.json(parseQuiz(row));
  } catch {
    return NextResponse.json({ ...payload, id: payload.id ?? `${Date.now()}` });
  }
}

export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await quizTable().deleteMany({ where: { id, userId: user.id } });
  } catch {
    /* table may not exist yet */
  }
  return NextResponse.json({ ok: true });
}
