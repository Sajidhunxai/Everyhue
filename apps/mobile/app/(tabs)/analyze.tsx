import * as ImagePicker from "expo-image-picker";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { AppButton } from "@/components/app-button";
import type { BodyType, FaceShape } from "@photomatcher/types";
import { analyzeWithOptions } from "@/lib/analyze-api";
import { useAuth } from "@/lib/auth-context";
import { samplesFromImageUri } from "@/lib/image-samples";
import { saveLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";

const FACE: FaceShape[] = ["oval", "round", "square", "heart", "oblong", "diamond"];
const BODY: BodyType[] = ["balanced", "pear", "apple", "hourglass", "rectangle", "inverted_triangle"];

export default function AnalyzeScreen() {
  const { user, accessToken } = useAuth();
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceShape, setFaceShape] = useState<FaceShape>("oval");
  const [bodyType, setBodyType] = useState<BodyType>("balanced");

  if (!user || !accessToken) return <Redirect href="/login" />;

  async function pick(fromCamera: boolean) {
    const token = accessToken;
    if (!token) return;
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission is required.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    setBusy(true);
    try {
      const samples = await samplesFromImageUri(result.assets[0].uri);
      const data = await analyzeWithOptions(token, samples, {
        faceShape,
        bodyType,
        profileId: typeof profileId === "string" ? profileId : undefined,
      });
      await saveLastAnalysis(data);
      router.push({ pathname: "/results", params: { payload: JSON.stringify(data) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyze failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Color analysis</Text>
      <Text style={styles.title}>Analyze</Text>
      <Text style={styles.lead}>
        Use daylight on your face. We verify the photo looks like a person before analyzing.
      </Text>
      {profileId ? (
        <Text style={styles.label}>Saving to family profile</Text>
      ) : null}
      <Text style={styles.label}>Face: {faceShape}</Text>
      <Pressable
        style={styles.chip}
        onPress={() => setFaceShape(FACE[(FACE.indexOf(faceShape) + 1) % FACE.length])}
      >
        <Text style={styles.chipText}>Change face shape</Text>
      </Pressable>
      <Text style={styles.label}>Body: {bodyType}</Text>
      <Pressable
        style={styles.chip}
        onPress={() => setBodyType(BODY[(BODY.indexOf(bodyType) + 1) % BODY.length])}
      >
        <Text style={styles.chipText}>Change body type</Text>
      </Pressable>
      {busy ? <ActivityIndicator color="#7B9FD4" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={busy} onPress={() => pick(true)}>
        Camera
      </AppButton>
      <AppButton variant="secondary" disabled={busy} onPress={() => pick(false)}>
        Gallery
      </AppButton>
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
  label: { color: theme.ink, marginTop: 8 },
  chip: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    backgroundColor: theme.surface,
  },
  chipText: { color: theme.primary, fontWeight: "600" },
  error: { color: theme.danger },
});
