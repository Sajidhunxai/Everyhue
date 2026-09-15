import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Family profiles",
  description: "Manage household color profiles in Every Hue.",
  path: "/profiles",
  noIndex: true,
});

export default function ProfilesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
