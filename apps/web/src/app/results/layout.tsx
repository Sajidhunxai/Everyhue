import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Results",
  description: "Your Every Hue seasonal color analysis results.",
  path: "/results",
  noIndex: true,
});

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
