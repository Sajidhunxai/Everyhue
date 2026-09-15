import { Link, router } from "expo-router";
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
import { FadeIn } from "@/components/fade-in";
import { useAuth } from "@/lib/auth-context";
import { fetchDashboardStats, type DashboardStats } from "@/lib/dashboard-api";
import { brand, theme } from "@/lib/theme";

const SWATCHES = ["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8", "#E07A7A", "#F5F3F0"];

const QUICK_LINKS = [
  { href: "/analyze", title: "Analyze", desc: "Upload a photo", icon: "◎" },
  { href: "/compare", title: "Compare", desc: "Best-lit photo", icon: "⇄" },
  { href: "/shop", title: "Shop", desc: "Colors for you", icon: "◈" },
  { href: "/wardrobe", title: "Wardrobe", desc: "Saved colors", icon: "▣" },
  { href: "/profiles", title: "Family", desc: "Household profiles", icon: "◉" },
  { href: "/stylist", title: "Stylist", desc: "Outfit advice", icon: "✦" },
  { href: "/quiz", title: "Style quiz", desc: "Suits & wardrobe plan", icon: "?" },
] as const;

function GuestHome() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <FadeIn>
        <BrandLogo size="lg" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>{brand.tagline}</Text>
        <Text style={styles.lead}>
          Discover your seasonal palette from a daylight photo. Sign in to save
          results across devices.
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
        { label: "Analyses", value: stats.analysisCount },
        { label: "Wardrobe", value: stats.wardrobeCount },
        { label: "Profiles", value: stats.profileCount },
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
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
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
        <FadeIn key={l.href} delay={300 + i * 50}>
          <Link href={l.href} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardIcon}>{l.icon}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{l.title}</Text>
                <Text style={styles.muted}>{l.desc}</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </Pressable>
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
  container: { padding: 24, gap: 10, paddingBottom: 48 },
  kicker: {
    color: theme.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  title: { color: theme.ink, fontSize: 26, fontWeight: "600", lineHeight: 32 },
  lead: { color: theme.muted, lineHeight: 22, marginBottom: 4 },
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
  primary: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 4,
  },
  primaryText: { color: theme.onPrimary, fontWeight: "700", fontSize: 16 },
  linkInline: { color: theme.primary, fontSize: 14, textAlign: "center", marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 8, marginVertical: 6 },
  statWrap: { flex: 1 },
  statCard: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    alignItems: "center",
  },
  statValue: { color: theme.ink, fontSize: 22, fontWeight: "700" },
  statLabel: {
    color: theme.muted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
    fontWeight: "600",
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    gap: 10,
  },
  cardIcon: { color: theme.primary, fontSize: 18, width: 24, textAlign: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { color: theme.ink, fontWeight: "600", fontSize: 16 },
  cardArrow: { color: theme.muted, fontSize: 16 },
  muted: { color: theme.muted, lineHeight: 20, fontSize: 14 },
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
  secondary: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryText: { color: theme.ink },
});
