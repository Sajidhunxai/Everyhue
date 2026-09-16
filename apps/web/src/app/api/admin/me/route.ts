import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
  });
}
