import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms", "/analyze", "/compare", "/shop", "/quiz"],
        disallow: [
          "/dashboard",
          "/wardrobe",
          "/profiles",
          "/stylist",
          "/results",
          "/account",
          "/api/",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
