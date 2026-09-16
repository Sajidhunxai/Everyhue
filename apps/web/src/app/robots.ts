import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms", "/analyze", "/compare", "/match", "/beauty", "/try-on", "/shop", "/quiz"],
        disallow: [
          "/dashboard",
          "/wardrobe",
          "/looks",
          "/profiles",
          "/stylist",
          "/results",
          "/account",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
