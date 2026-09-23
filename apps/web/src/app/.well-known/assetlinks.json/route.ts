import { NextResponse } from "next/server";

const PACKAGE_NAME = "com.asktheimageguru.everyhue";

function formatSha256(value: string) {
  const hex = value.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (hex.length !== 64) return "";
  return hex.match(/.{2}/g)?.join(":") ?? "";
}

export async function GET() {
  const fingerprints = (process.env.PLAY_ASSETLINKS_SHA256 || "")
    .split(",")
    .map(formatSha256)
    .filter(Boolean);

  if (!fingerprints.length) {
    return NextResponse.json([]);
  }

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
