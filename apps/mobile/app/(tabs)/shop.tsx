import { shopForSeason } from "@photomatcher/color-engine";
import type { AnalyzeResult } from "@photomatcher/types";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import { loadLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

export default function ShopScreen() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadLastAnalysis().then(setResult);
    }, []),
  );

  const items = result ? shopForSeason(result.seasonId) : [];

  return (
    <Screen>
      <FadeIn>
        <Text style={type.kicker}>Inspired by you</Text>
        <Text style={type.title}>Shop palette</Text>
        {result ? (
          <Text style={type.lead}>Curated picks for {result.seasonLabel}.</Text>
        ) : (
          <Text style={type.lead}>Run Analyze first to see items in your season.</Text>
        )}
      </FadeIn>
      {!result ? <AppButton onPress={() => router.push("/analyze")}>Go to Analyze</AppButton> : null}
      {items.slice(0, 12).map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={[styles.dot, { backgroundColor: item.hex }]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={type.muted}>{item.category}</Text>
            {item.searchTerms.length ? (
              <Text style={styles.search}>{item.searchTerms.slice(0, 2).join(" · ")}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    backgroundColor: theme.surface,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.line,
  },
  name: { color: theme.ink, fontFamily: "Manrope_700Bold", fontSize: 16 },
  search: { color: theme.dim, fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 2 },
});
