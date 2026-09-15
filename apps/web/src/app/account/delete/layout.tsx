import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Delete account",
  description: "Permanently delete your Every Hue account and saved data.",
  path: "/account/delete",
  noIndex: true,
});

export default function AccountDeleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
