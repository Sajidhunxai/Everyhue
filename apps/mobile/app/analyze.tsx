import * as ImagePicker from "expo-image-picker";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { analyzeLab } from "@photomatcher/api-client";
import { stubSamplesFromAverageRgb } from "@photomatcher/color-engine";
import { useAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/lib/config";

export default function AnalyzeScreen() {
  const { user, accessToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !accessToken) return <Redirect href="/login" />;

  async function pick(fromCamera: boolean) {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission is required to analyze a photo.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (result.canceled || !result.assets[0]) return;

    // Stub average skin-like sample until on-device face mesh is added.
    // TODO: MediaPipe Face Landmarker for cheek sampling.
    setBusy(true);
    try {
      const samples = stubSamplesFromAverageRgb(205, 155, 125);
      const data = await analyzeLab(
        getApiBaseUrl(),
        { mode: "lab", samples },
        { accessToken: accessToken! },
      );
      router.push({
        pathname: "/results",
        params: { payload: JSON.stringify(data) },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyze failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture in daylight</Text>
      <Text style={styles.lead}>
        Avoid filters and heavy makeup when possible. Camera and gallery access
        are only used for this analysis step.
      </Text>
      {busy ? <ActivityIndicator color="#E8A87C" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.primary} disabled={busy} onPress={() => pick(true)}>
        <Text style={styles.primaryText}>Use camera</Text>
      </Pressable>
      <Pressable style={styles.secondary} disabled={busy} onPress={() => pick(false)}>
        <Text style={styles.secondaryText}>Choose from gallery</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { color: "#F7F1EA", fontSize: 26, fontWeight: "600" },
  lead: { color: "#C4B5A5", lineHeight: 22 },
  primary: {
    backgroundColor: "#E8A87C",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "#1A1410", fontWeight: "700" },
  secondary: {
    borderWidth: 1,
    borderColor: "rgba(247,241,234,0.2)",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryText: { color: "#F7F1EA" },
  error: { color: "#E07A7A" },
});
