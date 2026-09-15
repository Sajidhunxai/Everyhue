import { createHmac, timingSafeEqual } from "crypto";

export type MobileTokenPayload = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  provider: "google" | "facebook" | "email";
  exp: number;
};

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

export function signMobileToken(
  payload: Omit<MobileTokenPayload, "exp">,
  ttlSeconds = 60 * 60 * 24 * 7,
): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const body: MobileTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const mid = b64urlJson(body);
  const data = `${header}.${mid}`;
  const sig = createHmac("sha256", secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, mid, sig] = parts;
  const data = `${header}.${mid}`;
  const expected = b64url(createHmac("sha256", secret).update(data).digest());
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const json = JSON.parse(
      Buffer.from(mid.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as MobileTokenPayload;
    if (!json.exp || json.exp < Math.floor(Date.now() / 1000)) return null;
    return json;
  } catch {
    return null;
  }
}

export async function verifyGoogleAccessToken(accessToken: string): Promise<{
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
} | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) return null;
  return {
    sub: `google:${data.sub}`,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

export async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
} | null> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    aud?: string;
  };
  if (!data.sub) return null;

  const allowedAud = [
    process.env.AUTH_GOOGLE_ID?.trim(),
    process.env.AUTH_GOOGLE_ANDROID_ID?.trim(),
  ].filter(Boolean) as string[];
  if (allowedAud.length > 0 && data.aud && !allowedAud.includes(data.aud)) {
    return null;
  }

  return {
    sub: `google:${data.sub}`,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

export async function verifyFacebookAccessToken(accessToken: string): Promise<{
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
} | null> {
  const url = new URL("https://graph.facebook.com/me");
  url.searchParams.set("fields", "id,name,email,picture.type(large)");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: { data?: { url?: string } };
  };
  if (!data.id) return null;
  return {
    sub: `facebook:${data.id}`,
    email: data.email,
    name: data.name,
    picture: data.picture?.data?.url,
  };
}
