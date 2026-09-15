import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { SignInPanel } from "@/components/sign-in-panel";
import { hashPassword, normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";

async function googleSignIn() {
  "use server";
  try {
    await signIn("google", { redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent(error.type)}`);
    }
    throw error;
  }
}

async function facebookSignIn() {
  "use server";
  try {
    await signIn("facebook", { redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent(error.type)}`);
    }
    throw error;
  }
}

async function emailAuth(formData: FormData) {
  "use server";
  const mode = String(formData.get("mode") ?? "signin");
  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!emailRaw || !password) {
    redirect(`/login?mode=${mode}&error=${encodeURIComponent("missing")}`);
  }

  if (mode === "signup") {
    if (password.length < 8) {
      redirect(`/login?mode=signup&error=${encodeURIComponent("weak_password")}`);
    }
    const email = normalizeEmail(emailRaw);
    const existing = await prisma.user.findFirst({
      where: { email, passwordHash: { not: null } },
    });
    if (existing) {
      redirect(`/login?mode=signup&error=${encodeURIComponent("exists")}`);
    }
    const oauthSameEmail = await prisma.user.findFirst({
      where: { email, passwordHash: null },
    });
    const displayName = name || email.split("@")[0] || "Every Hue user";
    const passwordHash = hashPassword(password);
    if (oauthSameEmail) {
      await prisma.user.update({
        where: { id: oauthSameEmail.id },
        data: { passwordHash, name: oauthSameEmail.name || displayName },
      });
    } else {
      await prisma.user.create({
        data: {
          id: `email:${email}`,
          email,
          name: displayName,
          passwordHash,
        },
      });
    }
  }

  try {
    await signIn("credentials", {
      email: emailRaw,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(
        `/login?mode=${mode}&error=${encodeURIComponent(error.type)}`,
      );
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const facebookReady = Boolean(
    process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
  );
  const googleReady = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  const errorMap: Record<string, string> = {
    missing: "Enter your email and password.",
    weak_password: "Password must be at least 8 characters.",
    exists: "An account with this email already exists. Sign in instead.",
    CredentialsSignin: "Invalid email or password.",
  };

  const errorMessage = params.error
    ? (errorMap[params.error] ??
      `Sign-in failed (${params.error}). Check your details and try again.`)
    : undefined;

  return (
    <SignInPanel
      error={errorMessage}
      mode={mode}
      googleReady={googleReady}
      facebookReady={facebookReady}
      googleAction={googleSignIn}
      facebookAction={facebookSignIn}
      emailAction={emailAuth}
    />
  );
}
