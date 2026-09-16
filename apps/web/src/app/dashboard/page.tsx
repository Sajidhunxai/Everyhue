import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardView, type DashboardLink } from "@/components/dashboard-view";
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
  let undertone: string | null = null;
  let palette: { hex: string; name: string }[] = [];
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
    if (latest) {
      const parsed = parseAnalysisJson(latest.resultJson);
      latestSeason = parsed.seasonLabel;
      undertone = parsed.undertone;
      palette = parsed.palette ?? [];
    }
  } catch (e) {
    console.error("[dashboard] database error", e);
    dbError =
      "Database connection failed. Check Vercel DATABASE_URL / DIRECT_URL (use Supabase pooler region ap-southeast-2), then redeploy.";
  }

  const links: DashboardLink[] = [
    { href: "/analyze", title: "Color analysis", desc: "Upload a daylight portrait for your season", icon: "analyze" },
    { href: "/compare", title: "Compare photos", desc: "Choose the better-lit shot first", icon: "compare" },
    { href: "/match", title: "Palette match", desc: "Score any hex against your colors", icon: "match" },
    { href: "/beauty", title: "Makeup & hair", desc: "Lips, metals, and hair hints", icon: "beauty" },
    { href: "/try-on", title: "Look studio", desc: "Preview hair, eyes, lips, jewelry, and dress", icon: "tryon" },
    { href: "/looks", title: "Saved looks", desc: "Build outfits from wardrobe colors", icon: "looks" },
    { href: "/shop", title: "Shop my palette", desc: "Suits, shirts, and accessories", icon: "shop" },
    {
      href: "/wardrobe",
      title: "Wardrobe",
      desc: `${wardrobeCount} saved item${wardrobeCount === 1 ? "" : "s"}`,
      icon: "wardrobe",
    },
    {
      href: "/profiles",
      title: "Family profiles",
      desc: `${profileCount} profile${profileCount === 1 ? "" : "s"}`,
      icon: "family",
    },
    { href: "/stylist", title: "AI stylist", desc: "Ask outfit questions in your palette", icon: "stylist" },
    { href: "/quiz", title: "Style quiz", desc: "Suits, outfits, and a shopping plan", icon: "quiz" },
    {
      href: "/results",
      title: "Latest results",
      desc: latestSeason ? `Last: ${latestSeason}` : "No analysis yet",
      icon: "results",
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
        stats={{ analysisCount, wardrobeCount, profileCount, latestSeason, undertone, palette }}
        links={links}
      />
    </>
  );
}
