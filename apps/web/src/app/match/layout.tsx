import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Palette match",
  description:
    "Score any hex or garment photo against your Every Hue seasonal palette before you buy.",
  path: "/match",
  keywords: ["color match", "hex score", "does this color suit me"],
});

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
