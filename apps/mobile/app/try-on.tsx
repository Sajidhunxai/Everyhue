import { buildTryOnCatalog } from "@photomatcher/color-engine";
import type { AnalyzeResult } from "@photomatcher/types";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import { TryOnStudio } from "@/components/try-on-studio";
import { useAuth } from "@/lib/auth-context";
import { loadLastAnalysis } from "@/lib/last-analysis";
import { loadLastPhoto, saveLastPhoto } from "@/lib/last-photo";
import { pickLibraryImage } from "@/lib/pick-image";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

export default function TryOnScreen() {
  const { accessToken } = useAuth();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const [analysis, photo] = await Promise.all([loadLastAnalysis(), loadLastPhoto()]);
    setResult(analysis);
    setPhotoUri(photo);
    setReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const catalog = useMemo(() => (result ? buildTryOnCatalog(result) : null), [result]);

  async function pickPhoto() {
    const picked = await pickLibraryImage(0.85);
    if (!picked) return;
    await saveLastPhoto(picked.uri);
    setPhotoUri(await loadLastPhoto());
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!result || !catalog) {
    return (
      <Screen>
        <FadeIn>
          <Text style={type.kicker}>Look studio</Text>
          <Text style={type.title}>Paint on your photo</Text>
          <Text style={type.lead}>
            Run a color analysis first, then paint hair, lips, jewelry, and dress colors on the
            portrait.
          </Text>
        </FadeIn>
        <Link href="/analyze" asChild>
          <AppButton>Analyze a photo</AppButton>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingBottom: 80 }}>
      <FadeIn>
        <Text style={type.kicker}>{result.seasonLabel}</Text>
        <Text style={type.title}>Look studio</Text>
        <Text style={type.lead}>
          Same Look studio as the website. Your portrait may be sent to our site
          and Google Gemini to recolor hair, eyes, lips, and clothes.
        </Text>
      </FadeIn>
      <AppButton variant="secondary" onPress={() => void pickPhoto()}>
        {photoUri ? "Change photo" : "Choose a portrait"}
      </AppButton>
      {photoUri ? (
        <TryOnStudio
          photoUri={photoUri}
          catalog={catalog}
          seasonLabel={result.seasonLabel}
          accessToken={accessToken}
        />
      ) : (
        <Text style={type.lead}>Choose the analysis portrait to start painting.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" },
});
