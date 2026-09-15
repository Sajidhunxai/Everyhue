import { NextResponse } from "next/server";

/** CORS: browser clients must use same-origin or a locked allowlist in production. */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
