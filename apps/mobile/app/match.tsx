import { labToHex, scoreHexAgainstPalette } from "@photomatcher/color-engine";
import type { AnalyzeResult, PaletteMatch } from "@photomatcher/types";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import { samplesFromImageUri } from "@/lib/image-samples";
import { loadLastAnalysis } from "@/lib/last-analysis";
import { pickLibraryImage } from "@/lib/pick-image";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

function normalizeHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

export default function MatchScreen() {
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [hexInput, setHexInput] = useState("#7B9FD4");
  const [match, setMatch] = useState<PaletteMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadLastAnalysis().then(setAnalysis);
    }, []),
  );

  function score(hex: string, palette = analysis) {
    if (!palette) return;
    const normalized = normalizeHex(hex);
    if (!normalized) {
      setError("Enter a 6-digit hex like #7B9FD4.");
      return;
    }
    setError(null);
    const scored = scoreHexAgainstPalette(normalized, palette.palette, palette.avoid);
    setMatch(scored);
    setHexInput(normalized);
  }

  async function fromPhoto() {
    if (!analysis) return;
    const result = await pickLibraryImage(0.7);
    if (!result) return;
    setBusy(true);
    try {
      const samples = await samplesFromImageUri(result.uri);
      score(labToHex(samples[0]));
    } catch {
      setError("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <FadeIn>
        <Text style={type.kicker}>Palette match</Text>
        <Text style={type.title}>Match a color</Text>
      </FadeIn>
      {!analysis ? (
        <>
          <Text style={type.lead}>Run an analysis first, then score any garment color against your season.</Text>
          <AppButton onPress={() => router.push("/analyze")}>Analyze a photo</AppButton>
        </>
      ) : (
        <>
          <Text style={type.lead}>
            Scoring against {analysis.seasonLabel}. Type a hex, or sample from a clothing photo.
          </Text>
          <TextInput
            style={styles.input}
            value={hexInput}
            onChangeText={setHexInput}
            autoCapitalize="characters"
            placeholder="#7B9FD4"
            placeholderTextColor={theme.dim}
          />
          <View style={[styles.preview, { backgroundColor: normalizeHex(hexInput) || "#1C2028" }]} />
          <AppButton onPress={() => score(hexInput)}>Score this color</AppButton>
          <AppButton variant="secondary" disabled={busy} onPress={() => void fromPhoto()}>
            {busy ? "Reading photo…" : "Sample from a photo"}
          </AppButton>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {match ? (
            <View style={styles.card}>
              <Text style={styles.score}>{match.score}%</Text>
              <Text style={styles.verdict}>{match.verdict}</Text>
              <Text style={type.lead}>
                Closest palette color: {match.closest.name} ({match.closest.hex})
              </Text>
              {match.nearestAvoid ? (
                <Text style={styles.muted}>Near an avoid shade: {match.nearestAvoid.name}</Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    fontSize: 16,
    fontFamily: "Manrope_400Regular",
    backgroundColor: theme.surface,
  },
  preview: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
  },
  error: { color: theme.danger },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    gap: 6,
  },
  score: { color: theme.ink, fontSize: 36, fontFamily: "Fraunces_600SemiBold" },
  verdict: { color: theme.primary, fontSize: 16, fontFamily: "Manrope_700Bold", textTransform: "capitalize" },
  muted: { color: theme.dim, lineHeight: 20, fontFamily: "Manrope_400Regular" },
});
