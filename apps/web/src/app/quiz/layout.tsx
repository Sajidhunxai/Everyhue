import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Style quiz",
  description:
    "Take the Every Hue style quiz for personalized suit picks, outfit ideas, and a wardrobe shopping plan.",
  path: "/quiz",
  keywords: ["style quiz", "suit quiz", "wardrobe plan"],
});

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
