import type { AnalyzeResult } from "@photomatcher/types";
import { auth } from "@/auth";
import { verifyMobileToken } from "@/lib/mobile-token";
import { prisma } from "@/lib/prisma";

export async function requireDbUser(req?: Request) {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      create: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
      update: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });
    return user;
  }

  if (req) {
    const header = req.headers.get("authorization");
    if (header?.startsWith("Bearer ")) {
      const payload = verifyMobileToken(header.slice(7));
      if (payload) {
        return prisma.user.upsert({
          where: { id: payload.sub },
          create: {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            image: payload.picture,
          },
          update: {
            email: payload.email,
            name: payload.name,
            image: payload.picture,
          },
        });
      }
    }
  }

  return null;
}

export function parseAnalysisJson(json: string): AnalyzeResult {
  return JSON.parse(json) as AnalyzeResult;
}

export async function deleteUserData(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
