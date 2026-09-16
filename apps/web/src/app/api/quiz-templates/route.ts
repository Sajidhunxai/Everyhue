import { NextResponse } from "next/server";
import type { CustomQuizQuestion, QuizTemplate } from "@photomatcher/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await (
      prisma as unknown as {
        quizTemplate: {
          findMany: (args: object) => Promise<
            {
              id: string;
              title: string;
              description: string;
              published: boolean;
              questionsJson: string;
              resultTitle: string;
              resultBody: string;
              createdAt: Date;
            }[]
          >;
        };
      }
    ).quizTemplate.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
    const list: QuizTemplate[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      published: row.published,
      questions: JSON.parse(row.questionsJson) as CustomQuizQuestion[],
      resultTitle: row.resultTitle,
      resultBody: row.resultBody,
      createdAt: row.createdAt.toISOString(),
    }));
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}
