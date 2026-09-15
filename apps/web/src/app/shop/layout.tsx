import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shop your palette",
  description:
    "Browse suit, shirt, and accessory color ideas matched to your Every Hue seasonal palette.",
  path: "/shop",
  keywords: ["shop by color", "suit colors", "palette shopping"],
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
