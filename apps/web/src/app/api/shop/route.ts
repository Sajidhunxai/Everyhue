import { NextResponse } from "next/server";
import { z } from "zod";
import { shopCategories, shopForSeason } from "@photomatcher/color-engine";
import type { SeasonId } from "@photomatcher/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId") as SeasonId | null;
  const category = searchParams.get("category") ?? undefined;
  const hex = searchParams.get("hex") ?? undefined;

  if (!seasonId) {
    return NextResponse.json({ error: "seasonId required" }, { status: 400 });
  }

  let items = shopForSeason(seasonId, category);
  if (hex) {
    items = items.filter((i) => i.hex.toUpperCase() === hex.toUpperCase());
  }

  return NextResponse.json({
    categories: shopCategories(seasonId),
    items,
  });
}
