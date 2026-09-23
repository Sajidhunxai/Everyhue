import { Link, router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandLogo } from "@/components/brand-logo";
import { AppButton } from "@/components/app-button";
import { AppCard } from "@/components/app-card";
import { FadeIn } from "@/components/fade-in";
import { TabIcon, type TabIconName } from "@/components/tab-icon";
import { useAuth } from "@/lib/auth-context";
import { fetchDashboardStats, type DashboardStats } from "@/lib/dashboard-api";
import { brand, theme } from "@/lib/theme";

const SWATCHES = ["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8", "#E07A7A", "#F5F3F0"];

const QUICK_LINKS: { href: Href; title: string; desc: string; icon: TabIconName }[] = [
  { href: "/analyze", title: "Analyze", desc: "Upload a photo", icon: "analyze" },
  { href: "/match", title: "Match", desc: "Score a garment color", icon: "match" },
  { href: "/beauty", title: "Makeup & hair", desc: "Lips, eyes, jewelry", icon: "beauty" },
  { href: "/try-on", title: "Look studio", desc: "Try seasonal colors", icon: "tryon" },
  { href: "/looks", title: "Looks", desc: "Saved outfits", icon: "looks" },
  { href: "/history", title: "History", desc: "Past analyses", icon: "history" },
  { href: "/quiz", title: "Style quiz", desc: "Suits & wardrobe plan", icon: "quiz" },
  { href: "/compare", title: "Compare", desc: "Best-lit photo", icon: "compare" },
  { href: "/shop", title: "Shop", desc: "Colors for you", icon: "shop" },
  { href: "/wardrobe", title: "Wardrobe", desc: "Saved colors", icon: "wardrobe" },
  { href: "/profiles", title: "Family", desc: "Household profiles", icon: "family" },
  { href: "/stylist", title: "Stylist", desc: "Outfit advice", icon: "stylist" },
];

function GuestHome() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <FadeIn>
        <BrandLogo size="lg" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>{brand.tagline}</Text>
        <Text style={styles.lead}>
          Discover your seasonal palette from a daylight photo. Sign in to save results across
          devices.
        </Text>
      </FadeIn>

      <FadeIn delay={80}>
        <Image
          source={require("../../assets/hero-home.png")}
          style={styles.heroImage}
          accessibilityLabel="Every Hue personal color analysis"
        />
      </FadeIn>

      <FadeIn delay={100}>
        <View style={styles.swatchRow}>
          {SWATCHES.map((hex) => (
            <View key={hex} style={[styles.swatch, { backgroundColor: hex }]} />
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={180}>
        <AppButton onPress={() => router.push("/login")}>Sign in to get started</AppButton>
        <Link href="/privacy" style={styles.linkInline}>
          How we handle your photos →
        </Link>
      </FadeIn>
    </ScrollView>
  );
}

function DashboardHome() {
  const { user, accessToken, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const data = await fetchDashboardStats(accessToken);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = user?.name?.split(" ")[0] ?? null;
  const statItems = stats
    ? [
        { label: "Analyses", value: stats.analysisCount, href: "/history" as Href },
        { label: "Wardrobe", value: stats.wardrobeCount, href: "/wardrobe" as Href },
        { label: "Profiles", value: stats.profileCount, href: "/profiles" as Href },
      ]
    : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={theme.primary}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      <FadeIn>
        <Text style={styles.kicker}>Your dashboard</Text>
        <Text style={styles.title}>Hello{firstName ? `, ${firstName}` : ""}</Text>
        <Text style={styles.lead}>
          {stats?.latestSeason
            ? `Latest season: ${stats.latestSeason}. Pick up where you left off.`
            : "Upload your first photo to discover your seasonal palette."}
        </Text>
      </FadeIn>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FadeIn delay={100}>
          <View style={styles.statsRow}>
            {statItems.map((s, i) => (
              <FadeIn key={s.label} delay={120 + i * 70} style={styles.statWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(s.href)}
                  style={({ pressed }) => [styles.statCard, pressed && styles.statPressed]}
                >
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </Pressable>
              </FadeIn>
            ))}
          </View>
        </FadeIn>
      )}

      <FadeIn delay={200}>
        <AppButton onPress={() => router.push("/analyze")}>
          {stats && stats.analysisCount > 0 ? "New analysis" : "Start analyzing"}
        </AppButton>
      </FadeIn>

      <FadeIn delay={260}>
        <Text style={styles.sectionLabel}>Quick links</Text>
      </FadeIn>

      {QUICK_LINKS.map((l, i) => (
        <FadeIn key={String(l.href)} delay={300 + i * 50}>
          <Link href={l.href} asChild>
            <AppCard>
              <View style={styles.cardIconWrap}>
                <TabIcon name={l.icon} color={theme.primary} size={28} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{l.title}</Text>
                <Text style={styles.muted}>{l.desc}</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </AppCard>
          </Link>
        </FadeIn>
      ))}

      <FadeIn delay={620}>
        <View style={styles.footer}>
          <Link href="/privacy" style={styles.footerLink}>
            Privacy
          </Link>
          <Link href="/terms" style={styles.footerLink}>
            Terms
          </Link>
          <Link href="/account-delete" style={styles.footerLinkDanger}>
            Delete account
          </Link>
          <AppButton variant="ghost" onPress={signOut}>
            Sign out
          </AppButton>
        </View>
      </FadeIn>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return user ? <DashboardHome /> : <GuestHome />;
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
  },
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 24, gap: 12, paddingBottom: 48 },
  kicker: {
    color: theme.primary,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
  },
  title: { color: theme.ink, fontSize: 28, fontFamily: "Fraunces_600SemiBold", lineHeight: 34 },
  lead: { color: theme.muted, lineHeight: 22, marginBottom: 4, fontFamily: "Manrope_400Regular" },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
  },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 4 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.line,
  },
  linkInline: { color: theme.primary, fontSize: 14, textAlign: "center", marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 10, marginVertical: 6 },
  statWrap: { flex: 1 },
  statCard: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    alignItems: "center",
    minHeight: 84,
    justifyContent: "center",
  },
  statPressed: { opacity: 0.82, borderColor: theme.primaryBorder },
  statValue: { color: theme.ink, fontSize: 26, fontFamily: "Fraunces_600SemiBold" },
  statLabel: {
    color: theme.primary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginTop: 4,
    fontFamily: "Manrope_700Bold",
  },
  sectionLabel: {
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 2,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primaryMuted,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
    marginRight: 4,
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { color: theme.ink, fontWeight: "600", fontSize: 16, fontFamily: "Manrope_600SemiBold" },
  cardArrow: { color: theme.muted, fontSize: 18, paddingLeft: 4 },
  muted: { color: theme.muted, lineHeight: 20, fontSize: 14, fontFamily: "Manrope_400Regular" },
  error: { color: theme.danger, marginVertical: 8 },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    gap: 10,
  },
  footerLink: { color: theme.primary, fontSize: 15 },
  footerLinkDanger: { color: theme.danger, fontSize: 15 },
});
