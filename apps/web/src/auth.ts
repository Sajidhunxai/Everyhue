import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  );
}

providers.push(
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const emailRaw = credentials?.email;
      const password = credentials?.password;
      if (typeof emailRaw !== "string" || typeof password !== "string") {
        return null;
      }
      const email = normalizeEmail(emailRaw);
      const user = await prisma.user.findFirst({
        where: { email, passwordHash: { not: null } },
      });
      if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
        return null;
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google" && (profile as { sub?: string })?.sub) {
        token.sub = `google:${(profile as { sub: string }).sub}`;
      }
      if (account?.provider === "facebook" && (profile as { id?: string })?.id) {
        token.sub = `facebook:${(profile as { id: string }).id}`;
      }
      if (account?.provider === "credentials" && user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  trustHost: true,
});
