import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Saved looks",
  description: "Build named outfits from your wardrobe colors and score them against your palette.",
  path: "/looks",
  noIndex: true,
});

export default function LooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
