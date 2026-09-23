import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Look studio",
  description: "Try seasonal hair, eye, lip, and clothing colors on your photo.",
  path: "/try-on/embed",
});

export default function TryOnEmbedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
