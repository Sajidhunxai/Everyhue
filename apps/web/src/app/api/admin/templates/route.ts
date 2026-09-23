import { NextResponse } from "next/server";
import { z } from "zod";
import type { CustomQuizQuestion, QuizTemplate } from "@photomatcher/types";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(160),
  subtitle: z.string().max(240).default(""),
  multi: z.boolean().optional(),
  options: z
    .array(
      z.object({
        value: z.string().min(1).max(40),
        label: z.string().min(1).max(80),
        emoji: z.string().max(8).optional(),
        desc: z.string().max(160).optional(),
      }),
    )
    .min(2)
    .max(8),
});

const bodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(80),
  description: z.string().max(400).default(""),
  published: z.boolean().optional(),
  questions: z.array(questionSchema).min(1).max(12),
  resultTitle: z.string().min(1).max(120),
  resultBody: z.string().min(1).max(800),
});

type TemplateRow = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  questionsJson: string;
  resultTitle: string;
  resultBody: string;
  createdAt: Date;
};

function table() {
  return (
    prisma as unknown as {
      quizTemplate: {
        findMany: (args: object) => Promise<TemplateRow[]>;
        create: (args: object) => Promise<TemplateRow>;
        update: (args: object) => Promise<TemplateRow>;
        deleteMany: (args: object) => Promise<{ count: number }>;
      };
    }
  ).quizTemplate;
}

function parse(row: TemplateRow): QuizTemplate {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    published: row.published,
    questions: JSON.parse(row.questionsJson) as CustomQuizQuestion[],
    resultTitle: row.resultTitle,
    resultBody: row.resultBody,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await table().findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows.map(parse));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a title, at least one question, and a result message." }, { status: 400 });
  }
  try {
    const row = parsed.data.id
      ? await table().update({
          where: { id: parsed.data.id },
          data: {
            title: parsed.data.title,
            description: parsed.data.description,
            published: parsed.data.published ?? false,
            questionsJson: JSON.stringify(parsed.data.questions),
            resultTitle: parsed.data.resultTitle,
            resultBody: parsed.data.resultBody,
          },
        })
      : await table().create({
          data: {
            title: parsed.data.title,
            description: parsed.data.description,
            published: parsed.data.published ?? false,
            questionsJson: JSON.stringify(parsed.data.questions),
            resultTitle: parsed.data.resultTitle,
            resultBody: parsed.data.resultBody,
          },
        });
    return NextResponse.json(parse(row));
  } catch {
    return NextResponse.json(
      { error: "Quiz table is not ready yet. Run prisma db push, then try again." },
      { status: 503 },
    );
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: string; published?: boolean } | null;
  if (!body?.id || typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Need id and published." }, { status: 400 });
  }
  try {
    const row = await table().update({ where: { id: body.id }, data: { published: body.published } });
    return NextResponse.json(parse(row));
  } catch {
    return NextResponse.json({ error: "Could not update quiz." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await table().deleteMany({ where: { id } });
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
