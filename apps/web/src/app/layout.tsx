import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { auth, signOut } from "@/auth";
import { AppProviders } from "@/components/app-providers";
import { BrandLogo } from "@/components/brand-logo";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import {
  buildMetadata,
  getSiteUrl,
  organizationJsonLd,
  siteConfig,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
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
  metadataBase: new URL(getSiteUrl()),
  ...buildMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: "/",
  }),
  title: {
    default: `${siteConfig.name} — Personal Color Analysis`,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: getSiteUrl() }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "lifestyle",
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: "/favicon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent",
  },
  other: {
    "theme-color": "#12141A",
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
        <JsonLd
          data={[
            organizationJsonLd(),
            websiteJsonLd(),
            softwareApplicationJsonLd(),
          ]}
        />
        <AppProviders>
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
        </AppProviders>
      </body>
    </html>
  );
}
