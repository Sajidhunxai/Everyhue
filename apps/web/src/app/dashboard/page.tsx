import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard-view";
import { prisma } from "@/lib/prisma";
import { parseAnalysisJson } from "@/lib/auth-user";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  let analysisCount = 0;
  let wardrobeCount = 0;
  let profileCount = 0;
  let latestSeason: string | null = null;
  let dbError: string | null = null;

  try {
    const [a, w, p, latest] = await Promise.all([
      prisma.analysis.count({ where: { userId } }),
      prisma.wardrobeItem.count({ where: { userId } }),
      prisma.familyProfile.count({ where: { userId } }),
      prisma.analysis.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    analysisCount = a;
    wardrobeCount = w;
    profileCount = p;
    latestSeason = latest
      ? parseAnalysisJson(latest.resultJson).seasonLabel
      : null;
  } catch (e) {
    console.error("[dashboard] database error", e);
    dbError =
      "Database connection failed. Check Vercel DATABASE_URL / DIRECT_URL (use Supabase pooler region ap-southeast-2), then redeploy.";
  }

  const links = [
    {
      href: "/analyze",
      title: "Color analysis",
      desc: "Upload a photo and get your seasonal palette",
      icon: "◎",
    },
    {
      href: "/compare",
      title: "Compare photos",
      desc: "Pick the best-lit photo before analyzing",
      icon: "⇄",
    },
    {
      href: "/match",
      title: "Palette match",
      desc: "Score any hex or garment color against your season",
      icon: "▣",
    },
    {
      href: "/beauty",
      title: "Makeup & hair",
      desc: "Lips, jewelry metals, and hair color hints",
      icon: "◈",
    },
    {
      href: "/looks",
      title: "Saved looks",
      desc: "Build outfits from wardrobe colors",
      icon: "✦",
    },
    {
      href: "/shop",
      title: "Shop my palette",
      desc: "Suits, shirts, and accessories in your colors",
      icon: "◈",
    },
    {
      href: "/wardrobe",
      title: "Wardrobe",
      desc: `${wardrobeCount} saved item${wardrobeCount === 1 ? "" : "s"}`,
      icon: "▣",
    },
    {
      href: "/profiles",
      title: "Family profiles",
      desc: `${profileCount} profile${profileCount === 1 ? "" : "s"}`,
      icon: "◉",
    },
    {
      href: "/stylist",
      title: "AI stylist",
      desc: "Ask outfit questions based on your palette",
      icon: "✦",
    },
    {
      href: "/quiz",
      title: "Style quiz",
      desc: "Personalized suits & wardrobe plan",
      icon: "?",
    },
    {
      href: "/results",
      title: "Latest results",
      desc: latestSeason ? `Last: ${latestSeason}` : "No analysis yet",
      icon: "◐",
    },
    {
      href: "/account/delete",
      title: "Delete account",
      desc: "Remove all server data permanently",
      icon: "×",
    },
  ];

  const firstName = session.user.name?.split(" ")[0] ?? null;

  return (
    <>
      {dbError ? (
        <p className="error" style={{ margin: "1rem 0" }}>
          {dbError}
        </p>
      ) : null}
      <DashboardView
        firstName={firstName}
        image={session.user.image ?? null}
        stats={{ analysisCount, wardrobeCount, profileCount, latestSeason }}
        links={links}
      />
    </>
  );
}
