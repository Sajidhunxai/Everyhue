import { NextResponse } from "next/server";
import { z } from "zod";
import { stylistReply, stylistReplyWithAi } from "@photomatcher/color-engine";
import type { StylistContext } from "@photomatcher/types";
import { rateLimit } from "@/lib/rate-limit";
import { requireDbUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  message: z.string().min(1).max(500),
  context: z.object({
    seasonLabel: z.string(),
    undertone: z.string(),
    palette: z.array(z.object({ hex: z.string(), name: z.string() })),
    neutrals: z.array(z.string()),
  }),
});

export async function GET(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(
    messages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  );
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = rateLimit(`stylist:${ip}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ctx = parsed.data.context as StylistContext;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const prior = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const history = prior.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const reply = apiKey
    ? await stylistReplyWithAi(parsed.data.message, ctx, apiKey, history)
    : stylistReply(parsed.data.message, ctx);

  await prisma.chatMessage.createMany({
    data: [
      { userId: user.id, role: "user", content: parsed.data.message },
      { userId: user.id, role: "assistant", content: reply },
    ],
  });

  return NextResponse.json({
    reply,
    mode: apiKey ? "ai" : "rules",
  });
}

export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.chatMessage.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
