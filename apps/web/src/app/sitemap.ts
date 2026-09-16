import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const publicRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/login", changeFrequency: "monthly", priority: 0.7 },
  { path: "/analyze", changeFrequency: "weekly", priority: 0.9 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.7 },
  { path: "/match", changeFrequency: "monthly", priority: 0.7 },
  { path: "/beauty", changeFrequency: "monthly", priority: 0.7 },
  { path: "/looks", changeFrequency: "monthly", priority: 0.6 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/quiz", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();
  return publicRoutes.map((r) => ({
    url: r.path === "/" ? site : `${site}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
