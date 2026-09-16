import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Makeup & hair",
  description:
    "Lip, cheek, eye, jewelry, and hair color hints matched to your Every Hue seasonal palette.",
  path: "/beauty",
  keywords: ["seasonal makeup", "hair color", "jewelry metals"],
});

export default function BeautyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
