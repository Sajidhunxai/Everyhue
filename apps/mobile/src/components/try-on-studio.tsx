import type { TryOnCatalog } from "@photomatcher/types";
import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { getApiBaseUrl } from "@/lib/config";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

type Props = {
  photoUri: string;
  catalog: TryOnCatalog;
  seasonLabel: string;
  accessToken?: string | null;
};

export function TryOnStudio({ photoUri, catalog, seasonLabel }: Props) {
  const webRef = useRef<WebView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uri = `${getApiBaseUrl()}/try-on/embed`;

  useEffect(() => {
    let cancelled = false;
    setPhoto(null);
    setError(null);
    void ImageManipulator.manipulateAsync(
      photoUri.split("?")[0],
      [{ resize: { width: 960 } }],
      { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    )
      .then((prepared) => {
        if (cancelled) return;
        if (!prepared.base64) {
          setError("Could not read that photo");
          return;
        }
        setPhoto(`data:image/jpeg;base64,${prepared.base64}`);
      })
      .catch(() => {
        if (!cancelled) setError("Could not read that photo");
      });
    return () => {
      cancelled = true;
    };
  }, [photoUri]);

  const payload = useMemo(
    () =>
      photo
        ? JSON.stringify({
            type: "tryon-init",
            catalog,
            photo,
            seasonLabel,
          })
        : null,
    [catalog, photo, seasonLabel],
  );

  function pushInit() {
    if (!payload) return;
    webRef.current?.injectJavaScript(`
      (function () {
        var data = ${payload};
        window.__TRYON_INIT = data;
        window.dispatchEvent(new CustomEvent("tryon-init", { detail: data }));
      })();
      true;
    `);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        This is the same Look studio as the website: hair, eyes, lips, blush, jewelry, and clothes.
      </Text>
      <View style={styles.frame}>
        {photo ? (
          <WebView
            ref={webRef}
            source={{ uri }}
            onLoadEnd={pushInit}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            setSupportMultipleWindows={false}
            originWhitelist={["https://*", "http://*"]}
            onShouldStartLoadWithRequest={(request) => {
              try {
                const host = new URL(request.url).hostname;
                return (
                  host === "asktheimageguru.com" ||
                  host.endsWith(".asktheimageguru.com") ||
                  host === "cdn.jsdelivr.net" ||
                  host.endsWith(".googleapis.com") ||
                  host.endsWith(".google.com")
                );
              } catch {
                return request.url.startsWith("about:") || request.url.startsWith("data:");
              }
            }}
            style={styles.web}
          />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.loadingText}>Opening the website Look studio…</Text>
          </View>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, minHeight: 640 },
  hint: { ...type.muted },
  frame: {
    minHeight: 640,
    height: 720,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
  },
  web: { flex: 1, backgroundColor: "transparent" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  loadingText: { ...type.muted, textAlign: "center" },
  error: { color: theme.danger, fontFamily: "Manrope_500Medium" },
});
