import { RESULT_IMAGES, seasonStory } from "@photomatcher/color-engine";
import type { AnalyzeResult, StyleGuide } from "@photomatcher/types";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppButton } from "@/components/app-button";
import { AppChip } from "@/components/app-chip";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import { exportResultPdf } from "@/lib/export-pdf";
import { loadLastAnalysis, saveLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

type Tab = "overview" | "wardrobe" | "beauty" | "fit";

function Bullets({ items }: { items: string[] }) {
  return items.map((item) => (
    <Text key={item} style={styles.body}>
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

function StoryCard({
  title,
  image,
  caption,
  children,
}: {
  title: string;
  image: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.media}>
        <Image source={{ uri: image }} style={styles.cardImage} />
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

function Wardrobe({ guide }: { guide: StyleGuide }) {
  return (
    <>
      <StoryCard title="Suits & formal wear" image={RESULT_IMAGES.suits} caption="Tailoring in your season">
        <Bullets items={guide.suits} />
      </StoryCard>
      <StoryCard title="Shirts & blouses" image={RESULT_IMAGES.shirts} caption="Closest to the face">
        <Bullets items={guide.shirtsAndBlouses} />
      </StoryCard>
      <StoryCard title="Casual & everyday" image={RESULT_IMAGES.casual} caption="Weekend color">
        <Bullets items={guide.casualWear} />
      </StoryCard>
      <StoryCard title="Dresses & skirts" image={RESULT_IMAGES.dresses} caption="One-piece looks">
        <Bullets items={guide.dressesAndSkirts} />
      </StoryCard>
      <StoryCard title="Ties & scarves" image={RESULT_IMAGES.ties} caption="Small color, big effect">
        <Bullets items={guide.tiesAndScarves} />
      </StoryCard>
      <StoryCard title="Denim" image={RESULT_IMAGES.denim} caption="Wash and finish">
        <Bullets items={guide.denim} />
      </StoryCard>
      <StoryCard title="Outerwear" image={RESULT_IMAGES.outerwear} caption="Coats that frame you">
        <Bullets items={guide.outerwear} />
      </StoryCard>
      <StoryCard title="Shoes & bags" image={RESULT_IMAGES.shoes} caption="Ground the outfit">
        <Bullets items={guide.shoesAndBags} />
      </StoryCard>
    </>
  );
}

function Beauty({ guide }: { guide: StyleGuide }) {
  return (
    <>
      <StoryCard title="Makeup" image={RESULT_IMAGES.makeup} caption="Lips, cheeks, eyes">
        <Text style={styles.mini}>Lips</Text>
        <Tags items={guide.makeup.lips} />
        <Text style={styles.mini}>Cheeks</Text>
        <Tags items={guide.makeup.cheeks} />
        <Text style={styles.mini}>Eyes</Text>
        <Tags items={guide.makeup.eyes} />
      </StoryCard>
      <StoryCard title="Jewelry & metals" image={RESULT_IMAGES.jewelry} caption="Finish for your undertone">
        <Tags items={guide.jewelry} />
      </StoryCard>
      <StoryCard title="Hair color hints" image={RESULT_IMAGES.hair} caption="Keep the season">
        <Bullets items={guide.hairColorHints} />
      </StoryCard>
      <View style={styles.plainCard}>
        <Text style={styles.cardTitle}>Patterns & neutrals</Text>
        <Tags items={[...guide.patterns, ...guide.neutrals]} />
      </View>
    </>
  );
}

export default function ResultsScreen() {
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

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
      <Screen>
        <FadeIn>
          <Text style={type.kicker}>Analysis</Text>
          <Text style={type.title}>No results yet</Text>
          <Text style={type.lead}>Run a color analysis to unlock your palette and look studio.</Text>
        </FadeIn>
        <AppButton onPress={() => router.push("/analyze")}>Analyze a photo</AppButton>
      </Screen>
    );
  }

  const guide = result.styleGuide;
  const story = seasonStory(result.seasonId, result.seasonLabel);

  return (
    <Screen contentStyle={{ paddingBottom: 80, paddingTop: 0, paddingHorizontal: 0, gap: 0 }}>
      <View style={styles.hero}>
        <Image source={{ uri: story.hero }} style={styles.heroImage} />
        <LinearGradient colors={["transparent", "rgba(18,20,26,0.55)", theme.bg]} style={styles.heroCopy}>
          <Text style={styles.heroKicker}>{story.mood}</Text>
          <Text style={styles.heroTitle}>{result.seasonLabel}</Text>
          <Text style={styles.heroBlurb}>{story.blurb}</Text>
          <View style={styles.pills}>
            <Text style={styles.pill}>{result.undertone} undertone</Text>
            <Text style={styles.pill}>{Math.round(result.confidence * 100)}% match</Text>
            {guide ? <Text style={styles.pill}>{guide.contrastLevel} contrast</Text> : null}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.pad}>
        <View style={styles.actions}>
          <AppButton onPress={() => router.push("/try-on" as Href)}>Look studio</AppButton>
          <View style={styles.actionRow}>
            <View style={styles.actionHalf}>
              <AppButton variant="secondary" onPress={() => router.push("/beauty" as Href)}>
                Makeup & hair
              </AppButton>
            </View>
            <View style={styles.actionHalf}>
              <AppButton variant="secondary" onPress={() => router.push("/quiz")}>
                Style quiz
              </AppButton>
            </View>
          </View>
          <View style={styles.actionRow}>
            <View style={styles.actionHalf}>
              <AppButton variant="ghost" onPress={() => void onExport()} disabled={exporting}>
                {exporting ? "Exporting…" : "Export PDF"}
              </AppButton>
            </View>
            <View style={styles.actionHalf}>
              <AppButton variant="ghost" onPress={() => router.push("/analyze")}>
                Analyze again
              </AppButton>
            </View>
          </View>
        </View>

        <Text style={styles.section}>Your palette</Text>
        <View style={styles.row}>
          {result.palette.map((s) => (
            <View key={s.hex + s.name} style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: s.hex }]} />
              <Text style={styles.swatchLabel}>{s.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["overview", "Overview"],
              ["wardrobe", "Wardrobe"],
              ["beauty", "Beauty"],
              ["fit", "Fit"],
            ] as const
          ).map(([id, label]) => (
            <AppChip key={id} selected={tab === id} onPress={() => setTab(id)}>
              {label}
            </AppChip>
          ))}
        </View>

        {tab === "overview" ? (
          <>
            <View style={styles.plainCard}>
              <Text style={styles.cardTitle}>How to wear it</Text>
              <Bullets items={result.tips} />
            </View>
            {guide ? (
              <StoryCard title="Occasion outfits" image={RESULT_IMAGES.occasion} caption="Ready-made looks">
                {guide.occasions.map((o) => (
                  <View key={o.label} style={styles.occasionCard}>
                    <Text style={styles.occasionLabel}>{o.label}</Text>
                    <Text style={styles.body}>{o.suggestion}</Text>
                  </View>
                ))}
              </StoryCard>
            ) : null}
            <View style={styles.plainCard}>
              <Text style={styles.cardTitle}>Usually skip</Text>
              <Text style={type.muted}>Too far from your season.</Text>
              <View style={styles.row}>
                {result.avoid.map((s) => (
                  <View key={s.hex + s.name} style={styles.swatchWrap}>
                    <View style={[styles.swatch, { backgroundColor: s.hex }]} />
                    <Text style={styles.swatchLabel}>{s.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {tab === "wardrobe" && guide ? <Wardrobe guide={guide} /> : null}
        {tab === "beauty" && guide ? <Beauty guide={guide} /> : null}
        {tab === "fit" ? (
          result.faceBodyTips ? (
            <>
              <StoryCard title="Face & body" image={RESULT_IMAGES.fit} caption="Shape, not just color">
                <Text style={type.muted}>
                  Face: {result.faceBodyTips.faceShape} · Body: {result.faceBodyTips.bodyType}
                </Text>
                <Text style={styles.mini}>Necklines</Text>
                <Bullets items={result.faceBodyTips.neckline} />
                <Text style={styles.mini}>Silhouettes</Text>
                <Bullets items={result.faceBodyTips.silhouettes} />
              </StoryCard>
              <StoryCard title="Eyewear" image={RESULT_IMAGES.eyewear} caption="Frames near the face">
                <Bullets items={result.faceBodyTips.eyewear} />
              </StoryCard>
            </>
          ) : (
            <Text style={type.lead}>Add face and body notes when you analyze for a custom fit guide.</Text>
          )
        ) : null}

        <Text style={styles.engine}>Engine {result.engine_version}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: 4 },
  heroImage: { width: "100%", height: 280 },
  heroCopy: {
    marginTop: -168,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 6,
  },
  heroKicker: { ...type.kicker, color: theme.peach },
  heroTitle: { ...type.title, fontSize: 34, lineHeight: 40 },
  heroBlurb: { ...type.lead, color: theme.ink },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  pill: {
    ...type.muted,
    fontSize: 11,
    color: theme.ink,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "rgba(18,20,26,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pad: { paddingHorizontal: 24, gap: 12, paddingBottom: 24 },
  actions: { gap: 10, marginTop: 4, marginBottom: 4 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionHalf: { flex: 1 },
  section: { ...type.title, fontSize: 20, lineHeight: 26, marginTop: 4 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatchWrap: { width: 72, alignItems: "center" },
  swatch: { width: 64, height: 64, borderRadius: 14, borderWidth: 1, borderColor: theme.line },
  swatchLabel: { ...type.muted, fontSize: 11, textAlign: "center", marginTop: 4 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  card: {
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
  },
  cardImage: { width: "100%", height: 148 },
  media: { position: "relative" },
  caption: {
    position: "absolute",
    left: 12,
    bottom: 12,
    overflow: "hidden",
    color: theme.ink,
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
    backgroundColor: "rgba(18,20,26,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardBody: { padding: 14, gap: 6 },
  cardTitle: { ...type.title, fontSize: 20, lineHeight: 26 },
  plainCard: {
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  body: { ...type.lead, color: theme.muted },
  mini: { ...type.label, color: theme.primary, marginTop: 6 },
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
  occasionCard: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    marginTop: 4,
  },
  occasionLabel: { color: theme.peach, fontFamily: "Manrope_600SemiBold" },
  engine: { ...type.muted, fontSize: 12, marginTop: 8 },
});
