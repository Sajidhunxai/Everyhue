import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { AppChip } from "@/components/app-chip";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import type { BodyType, FaceShape } from "@photomatcher/types";
import { analyzeWithOptions } from "@/lib/analyze-api";
import { useAuth } from "@/lib/auth-context";
import { samplesFromImageUri } from "@/lib/image-samples";
import { saveLastAnalysis } from "@/lib/last-analysis";
import { saveLastPhoto } from "@/lib/last-photo";
import { pickCameraImage, pickLibraryImage } from "@/lib/pick-image";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

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
    const asset = fromCamera ? await pickCameraImage(0.7) : await pickLibraryImage(0.7);
    if (!asset) {
      setError(fromCamera ? "Camera permission is required." : "Choose a photo to continue.");
      return;
    }

    setBusy(true);
    try {
      const samples = await samplesFromImageUri(asset.uri);
      const data = await analyzeWithOptions(token, samples, {
        faceShape,
        bodyType,
        profileId: typeof profileId === "string" ? profileId : undefined,
      });
      await saveLastPhoto(asset.uri);
      await saveLastAnalysis(data);
      router.push({ pathname: "/results", params: { payload: JSON.stringify(data) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyze failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <FadeIn>
        <Text style={type.kicker}>Color analysis</Text>
        <Text style={type.title}>Analyze</Text>
        <Text style={type.lead}>
          Use daylight on your face. The photo stays on this device for sampling
          and may be saved with your analysis. We do not use it for ads.
        </Text>
      </FadeIn>
      {profileId ? <Text style={type.label}>Saving to family profile</Text> : null}
      <Text style={type.label}>Face shape</Text>
      <View style={styles.row}>
        {FACE.map((item) => (
          <AppChip key={item} selected={faceShape === item} onPress={() => setFaceShape(item)}>
            {item}
          </AppChip>
        ))}
      </View>
      <Text style={type.label}>Body type</Text>
      <View style={styles.row}>
        {BODY.map((item) => (
          <AppChip key={item} selected={bodyType === item} onPress={() => setBodyType(item)}>
            {item.replaceAll("_", " ")}
          </AppChip>
        ))}
      </View>
      {busy ? <ActivityIndicator color={theme.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={busy} onPress={() => pick(true)}>
        Camera
      </AppButton>
      <AppButton variant="secondary" disabled={busy} onPress={() => pick(false)}>
        Gallery
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  error: { color: theme.danger, fontFamily: "Manrope_500Medium" },
});
