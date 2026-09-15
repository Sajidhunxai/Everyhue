import { shopForSeason } from "@photomatcher/color-engine";
import type { AnalyzeResult } from "@photomatcher/types";
import { Link } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { loadLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";

export default function ShopScreen() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadLastAnalysis().then(setResult);
    }, []),
  );

  const items = result ? shopForSeason(result.seasonId) : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Inspired by you</Text>
      <Text style={styles.title}>Shop palette</Text>
      {result ? (
        <Text style={styles.lead}>Curated picks for {result.seasonLabel}.</Text>
      ) : (
        <>
          <Text style={styles.lead}>Run Analyze first to see items in your season.</Text>
          <Link href="/analyze" style={styles.link}>
            Go to Analyze →
          </Link>
        </>
      )}
      {items.slice(0, 12).map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={[styles.dot, { backgroundColor: item.hex }]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.category}</Text>
            {item.searchTerms.length ? (
              <Text style={styles.muted}>{item.searchTerms.slice(0, 2).join(" · ")}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 24, gap: 10, paddingBottom: 48 },
  kicker: {
    color: theme.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  title: { color: theme.ink, fontSize: 26, fontWeight: "600" },
  lead: { color: theme.muted, lineHeight: 22 },
  meta: { color: theme.muted, fontSize: 13 },
  muted: { color: theme.dim, fontSize: 12, marginTop: 2 },
  link: { color: theme.primary, fontWeight: "600", marginTop: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    backgroundColor: theme.surface,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.line,
  },
  name: { color: theme.ink, fontWeight: "600", fontSize: 16 },
});
