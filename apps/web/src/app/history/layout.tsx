import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Analysis history",
  description: "Open, rename, download, or delete your past Every Hue color analyses.",
  path: "/history",
  noIndex: true,
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
