import type { CompareResult } from "@photomatcher/types";
import * as ImagePicker from "expo-image-picker";
import { Redirect } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { compareWithApi } from "@/lib/compare-api";
import { samplesFromImageUri } from "@/lib/image-samples";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export default function CompareScreen() {
  const { user, accessToken } = useAuth();
  const [uriA, setUriA] = useState<string | null>(null);
  const [uriB, setUriB] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !accessToken) return <Redirect href="/login" />;

  async function pick(slot: "A" | "B") {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Gallery permission is required.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (picked.canceled || !picked.assets[0]) return;
    if (slot === "A") setUriA(picked.assets[0].uri);
    else setUriB(picked.assets[0].uri);
    setResult(null);
  }

  async function runCompare() {
    if (!uriA || !uriB || !accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const [samplesA, samplesB] = await Promise.all([
        samplesFromImageUri(uriA),
        samplesFromImageUri(uriB),
      ]);
      setResult(
        await compareWithApi(
          accessToken,
          { label: "Photo A", samples: samplesA },
          { label: "Photo B", samples: samplesB },
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compare failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Lighting check</Text>
      <Text style={styles.title}>Compare</Text>
      <Text style={styles.lead}>
        Pick two face photos to see which has better lighting for analysis.
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.photoBox} onPress={() => pick("A")}>
          {uriA ? (
            <Image source={{ uri: uriA }} style={styles.thumb} />
          ) : (
            <Text style={styles.photoHint}>Photo A</Text>
          )}
        </Pressable>
        <Pressable style={styles.photoBox} onPress={() => pick("B")}>
          {uriB ? (
            <Image source={{ uri: uriB }} style={styles.thumb} />
          ) : (
            <Text style={styles.photoHint}>Photo B</Text>
          )}
        </Pressable>
      </View>

      {busy ? <ActivityIndicator color={theme.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton disabled={!uriA || !uriB || busy} onPress={runCompare}>
        Compare lighting
      </AppButton>

      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Recommendation</Text>
          <Text style={styles.lead}>{result.recommendation}</Text>
          <Text style={styles.muted}>Lighting: {result.lightingScore}/100</Text>
          <Text style={styles.muted}>Consistency: {result.consistencyScore}/100</Text>
          <Text style={styles.muted}>
            {result.photoA.label}: {result.photoA.brightness}
          </Text>
          <Text style={styles.muted}>
            {result.photoB.label}: {result.photoB.brightness}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 24, gap: 12, paddingBottom: 48 },
  kicker: {
    color: theme.primary,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
  },
  title: { color: theme.ink, fontSize: 28, fontFamily: "Fraunces_600SemiBold" },
  lead: { color: theme.muted, lineHeight: 22, fontFamily: "Manrope_400Regular" },
  muted: { color: theme.dim, fontSize: 13 },
  photoHint: { color: theme.muted, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  photoBox: {
    flex: 1,
    height: 140,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 14,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  error: { color: theme.danger },
  result: {
    gap: 6,
    marginTop: 4,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
  },
  resultTitle: { color: theme.ink, fontWeight: "700", fontSize: 15 },
});
