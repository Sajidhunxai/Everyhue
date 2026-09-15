import { NextResponse } from "next/server";
import { requireDbUser, deleteUserData } from "@/lib/auth-user";

/** DELETE — wipe user data (Play Store account deletion). Cookie or Bearer. */
export async function DELETE(req: Request) {
  const user = await requireDbUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteUserData(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
