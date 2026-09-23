import type { Metadata } from "next";

export const siteConfig = {
  name: "Every Hue",
  shortName: "Every Hue",
  tagline: "Find the hues that belong with you",
  description:
    "Personal seasonal color analysis from a daylight photo. Get your palette, shop matching colors, build a wardrobe, and get AI stylist advice — for you and your family.",
  locale: "en_US",
  twitterHandle: "", // add later if you have one
  email: "support@asktheimageguru.com",
} as const;

/** Canonical site origin (no trailing slash). */
export function getSiteUrl(): string {
  const fromAuth = process.env.AUTH_URL?.trim();
  if (fromAuth) return fromAuth.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://www.asktheimageguru.com";
}

type PageSeo = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  keywords?: string[];
};

export function buildMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
  image = "/images/hero-every-hue.png",
  keywords = [],
  absoluteTitle,
}: PageSeo & { absoluteTitle?: boolean }): Metadata {
  const site = getSiteUrl();
  const url = path === "/" ? site : `${site}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = image.startsWith("http") ? image : `${site}${image}`;
  const fullTitle =
    absoluteTitle || title === siteConfig.name
      ? `${siteConfig.name} — Personal Color Analysis`
      : `${title} | ${siteConfig.name}`;

  return {
    title: absoluteTitle || title === siteConfig.name
      ? { absolute: fullTitle }
      : title,
    description,
    keywords: [
      "seasonal color analysis",
      "personal color palette",
      "undertone",
      "wardrobe colors",
      "Every Hue",
      ...keywords,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      ...(siteConfig.twitterHandle
        ? { creator: siteConfig.twitterHandle, site: siteConfig.twitterHandle }
        : {}),
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: site,
    logo: `${site}/brand/every-hue-mark.svg`,
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: [] as string[],
  };
}

export function websiteJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: site,
    description: siteConfig.description,
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}

export function softwareApplicationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web, iOS, Android",
    url: site,
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Seasonal color analysis from a photo",
      "Personal palette and undertone",
      "Wardrobe color saver",
      "Shop recommendations",
      "Family profiles",
      "AI stylist chat",
      "Style quiz",
      "Look studio try-on",
      "Analysis history",
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path === "/" ? site : `${site}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
