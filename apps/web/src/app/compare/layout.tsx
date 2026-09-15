import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Compare photos",
  description:
    "Compare two face photos and see which has better lighting for accurate seasonal color analysis.",
  path: "/compare",
  keywords: ["photo lighting", "compare photos"],
});

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
