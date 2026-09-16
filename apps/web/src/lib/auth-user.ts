import type { AnalyzeResult, FaceShape, BodyType, SavedAnalysis } from "@photomatcher/types";
import { auth } from "@/auth";
import { verifyMobileToken } from "@/lib/mobile-token";
import { prisma } from "@/lib/prisma";

type HistoryEnvelope = AnalyzeResult & {
  historyTitle?: string;
  historyNotes?: string;
  historyPhoto?: string;
};

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
  const raw = JSON.parse(json) as HistoryEnvelope;
  const { historyTitle: _title, historyNotes: _notes, historyPhoto: _photo, ...result } = raw;
  return result;
}

export function parseSavedAnalysis(
  row: {
    id: string;
    profileId: string | null;
    faceShape: string | null;
    bodyType: string | null;
    resultJson: string;
    createdAt: Date;
  },
  options?: { includePhoto?: boolean },
): SavedAnalysis {
  const raw = JSON.parse(row.resultJson) as HistoryEnvelope;
  const { historyTitle, historyNotes, historyPhoto, ...result } = raw;
  return {
    id: row.id,
    profileId: row.profileId,
    faceShape: (row.faceShape as FaceShape | null) ?? undefined,
    bodyType: (row.bodyType as BodyType | null) ?? undefined,
    result,
    title: historyTitle?.trim() || null,
    notes: historyNotes?.trim() || null,
    hasPhoto: Boolean(historyPhoto),
    photoDataUrl: options?.includePhoto ? historyPhoto ?? null : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mergeHistoryJson(
  json: string,
  patch: { title?: string | null; notes?: string | null; photoDataUrl?: string | null },
) {
  const raw = JSON.parse(json) as HistoryEnvelope;
  if (patch.title !== undefined) {
    const title = patch.title?.trim();
    if (title) raw.historyTitle = title;
    else delete raw.historyTitle;
  }
  if (patch.notes !== undefined) {
    const notes = patch.notes?.trim();
    if (notes) raw.historyNotes = notes;
    else delete raw.historyNotes;
  }
  if (patch.photoDataUrl !== undefined) {
    const photo = patch.photoDataUrl?.trim();
    if (photo) raw.historyPhoto = photo;
    else delete raw.historyPhoto;
  }
  return JSON.stringify(raw);
}

export async function deleteUserData(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
