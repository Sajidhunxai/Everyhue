import type { AnalyzeResult } from "@photomatcher/types";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import { loadLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

function Tags({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.tagRow}>
      {items.map((item) => (
        <Text key={item} style={styles.tag}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export default function BeautyScreen() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadLastAnalysis().then(setResult);
    }, []),
  );

  if (!result?.styleGuide) {
    return (
      <Screen>
        <FadeIn>
          <Text style={type.title}>Makeup & hair</Text>
          <Text style={type.lead}>
            Complete a color analysis first to unlock lip, cheek, eye, jewelry, and hair hints.
          </Text>
        </FadeIn>
        <AppButton onPress={() => router.push("/analyze")}>Analyze a photo</AppButton>
      </Screen>
    );
  }

  const guide = result.styleGuide;

  return (
    <Screen>
      <FadeIn>
        <Text style={type.kicker}>{result.seasonLabel}</Text>
        <Text style={type.title}>Makeup & hair</Text>
        <Text style={type.lead}>
          Beauty and metal notes for a {result.undertone} undertone with {guide.contrastLevel} contrast.
        </Text>
      </FadeIn>
      <AppButton onPress={() => router.push("/try-on" as Href)}>Open look studio</AppButton>
      <AppButton variant="secondary" onPress={() => router.push("/shop")}>
        Shop palette
      </AppButton>
      <Text style={styles.section}>Lips</Text>
      <Tags items={guide.makeup.lips} />
      <Text style={styles.section}>Cheeks</Text>
      <Tags items={guide.makeup.cheeks} />
      <Text style={styles.section}>Eyes</Text>
      <Tags items={guide.makeup.eyes} />
      <Text style={styles.section}>Jewelry & metals</Text>
      <Tags items={guide.jewelry} />
      <Text style={styles.section}>Hair color hints</Text>
      {guide.hairColorHints.map((item) => (
        <Text key={item} style={type.lead}>
          • {item}
        </Text>
      ))}
      <Text style={styles.section}>Patterns & neutrals</Text>
      <Tags items={[...guide.patterns, ...guide.neutrals]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...type.title, fontSize: 20, marginTop: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    color: theme.ink,
    fontFamily: "Manrope_600SemiBold",
    backgroundColor: theme.primaryMuted,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
  },
});
