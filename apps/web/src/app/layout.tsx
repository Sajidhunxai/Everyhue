import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { auth, signOut } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Every Hue — Personal Color Analysis",
  description:
    "Find the hues that belong with you. Seasonal color analysis and wardrobe palettes for everyone.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body
        style={
          {
            ["--font-display" as string]: "var(--font-fraunces), Georgia, serif",
            ["--font-body" as string]: "var(--font-manrope), system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <BrandLogo href="/" size="md" />
              <SiteNav user={session?.user ?? null} signOutAction={handleSignOut} />
            </div>
          </header>

          <main className="site-main">{children}</main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
