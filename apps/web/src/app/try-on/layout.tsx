import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Look studio",
  description:
    "Try hair, eye, lip, blush, jewelry, and dress colors matched to your Every Hue seasonal palette.",
  path: "/try-on",
  keywords: ["hair color try on", "eye color", "lipstick", "virtual makeup"],
});

export default function TryOnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
