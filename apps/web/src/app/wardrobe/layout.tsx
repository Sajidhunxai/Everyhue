import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Wardrobe",
  description: "Save and manage garment colors in your Every Hue wardrobe.",
  path: "/wardrobe",
  noIndex: true,
});

export default function WardrobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
