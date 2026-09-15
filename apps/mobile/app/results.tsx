import type { AnalyzeResult, StyleGuide } from "@photomatcher/types";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { exportResultPdf } from "@/lib/export-pdf";
import { loadLastAnalysis, saveLastAnalysis } from "@/lib/last-analysis";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return items.map((item) => (
    <Text key={item} style={styles.lead}>
      • {item}
    </Text>
  ));
}

function Tags({ items }: { items: string[] }) {
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

function StyleGuideView({ guide }: { guide: StyleGuide }) {
  return (
    <>
      <Section title="Suits & formal wear">
        <Bullets items={guide.suits} />
      </Section>
      <Section title="Shirts & blouses">
        <Bullets items={guide.shirtsAndBlouses} />
      </Section>
      <Section title="Casual & everyday">
        <Bullets items={guide.casualWear} />
      </Section>
      <Section title="Dresses & skirts">
        <Bullets items={guide.dressesAndSkirts} />
      </Section>
      <Section title="Best neutrals">
        <Tags items={guide.neutrals} />
      </Section>
      <Section title="Makeup — lips">
        <Tags items={guide.makeup.lips} />
      </Section>
      <Section title="Makeup — cheeks">
        <Tags items={guide.makeup.cheeks} />
      </Section>
      <Section title="Makeup — eyes">
        <Tags items={guide.makeup.eyes} />
      </Section>
      <Section title="Jewelry & metals">
        <Tags items={guide.jewelry} />
      </Section>
      <Section title="Outfit ideas">
        {guide.occasions.map((o) => (
          <View key={o.label} style={styles.occasionCard}>
            <Text style={styles.occasionLabel}>{o.label}</Text>
            <Text style={styles.lead}>{o.suggestion}</Text>
          </View>
        ))}
      </Section>
    </>
  );
}

export default function ResultsScreen() {
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (payload) {
      try {
        const parsed = JSON.parse(payload) as AnalyzeResult;
        setResult(parsed);
        void saveLastAnalysis(parsed);
        return;
      } catch {
        /* fall through */
      }
    }
    void loadLastAnalysis().then(setResult);
  }, [payload]);

  async function onExport() {
    if (!result) return;
    setExporting(true);
    try {
      await exportResultPdf(result);
    } finally {
      setExporting(false);
    }
  }

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No results yet</Text>
        <Link href="/analyze" style={styles.link}>
          Run an analysis
        </Link>
      </View>
    );
  }

  const guide = result.styleGuide;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.muted}>Engine {result.engine_version}</Text>
      <Text style={styles.title}>{result.seasonLabel}</Text>
      <Text style={styles.lead}>
        Undertone: {result.undertone} · Confidence{" "}
        {Math.round(result.confidence * 100)}%
        {guide ? ` · Contrast: ${guide.contrastLevel}` : ""}
      </Text>

      <Section title="Your palette">
        <View style={styles.row}>
          {result.palette.map((s) => (
            <View key={s.hex + s.name} style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: s.hex }]} />
              <Text style={styles.swatchLabel}>{s.name}</Text>
            </View>
          ))}
        </View>
      </Section>

      {guide ? <StyleGuideView guide={guide} /> : null}

      {result.faceBodyTips ? (
        <>
          <Section title="Face & body styling">
            <Text style={styles.lead}>
              Face: {result.faceBodyTips.faceShape} · Body: {result.faceBodyTips.bodyType}
            </Text>
          </Section>
          <Section title="Necklines">
            <Bullets items={result.faceBodyTips.neckline} />
          </Section>
          <Section title="Silhouettes">
            <Bullets items={result.faceBodyTips.silhouettes} />
          </Section>
          <Section title="Eyewear">
            <Bullets items={result.faceBodyTips.eyewear} />
          </Section>
        </>
      ) : null}

      <Section title="Usually avoid">
        <View style={styles.row}>
          {result.avoid.map((s) => (
            <View key={s.hex + s.name} style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: s.hex }]} />
              <Text style={styles.swatchLabel}>{s.name}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Quick tips">
        <Bullets items={result.tips} />
      </Section>

      <Link href="/quiz" style={styles.quizCta}>
        Take style quiz — suits & wardrobe plan →
      </Link>

      <Pressable style={styles.exportBtn} onPress={onExport} disabled={exporting}>
        <Text style={styles.exportText}>{exporting ? "Exporting…" : "Export PDF"}</Text>
      </Pressable>

      <Link href="/analyze" style={styles.link}>
        Analyze again
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 10, paddingBottom: 48 },
  block: { marginTop: 8, gap: 6 },
  title: { color: "#F5F3F0", fontSize: 28, fontWeight: "600" },
  muted: { color: "#A8AEB8" },
  lead: { color: "#A8AEB8", lineHeight: 22 },
  section: { color: "#F5F3F0", fontSize: 18, marginTop: 8, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatchWrap: { width: 72, alignItems: "center" },
  swatch: { width: 64, height: 64, borderRadius: 12 },
  swatchLabel: { color: "#A8AEB8", fontSize: 11, textAlign: "center", marginTop: 4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    color: "#F5F3F0",
    backgroundColor: "rgba(123,159,212,0.15)",
    borderWidth: 1,
    borderColor: "rgba(123,159,212,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
  },
  occasionCard: {
    borderWidth: 1,
    borderColor: "rgba(245,243,240,0.12)",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    gap: 4,
  },
  occasionLabel: { color: "#7B9FD4", fontWeight: "600" },
  exportBtn: {
    marginTop: 12,
    backgroundColor: "#7B9FD4",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  exportText: { color: "#12141A", fontWeight: "700" },
  quizCta: {
    color: "#7B9FD4",
    marginTop: 16,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
  },
  link: { color: "#7B9FD4", marginTop: 16 },
});
