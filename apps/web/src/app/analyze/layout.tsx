import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Color analysis",
  description:
    "Upload a daylight face photo for seasonal color analysis. Get your undertone, palette, and styling tips with Every Hue.",
  path: "/analyze",
  keywords: ["upload photo", "color season test", "undertone analysis"],
});

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
