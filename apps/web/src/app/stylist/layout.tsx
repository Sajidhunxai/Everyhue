import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "AI stylist",
  description: "Ask outfit and styling questions tailored to your Every Hue palette.",
  path: "/stylist",
  noIndex: true,
});

export default function StylistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
