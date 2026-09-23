import type { SavedAnalysis } from "@photomatcher/types";
import { Redirect, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AppButton } from "@/components/app-button";
import { deleteAnalysis, getAnalysis, listAnalyses } from "@/lib/analyses-api";
import { useAuth } from "@/lib/auth-context";
import { saveLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";

export default function HistoryScreen() {
  const { user, accessToken } = useAuth();
  const [rows, setRows] = useState<SavedAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      setRows(await listAnalyses(accessToken));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
    } finally {
      setRefreshing(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!user || !accessToken) return <Redirect href="/login" />;
  const token = accessToken;

  async function open(id: string) {
    const row = await getAnalysis(token, id);
    await saveLastAnalysis(row.result);
    router.push({ pathname: "/results", params: { payload: JSON.stringify(row.result) } });
  }

  function remove(id: string) {
    Alert.alert("Delete this analysis?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteAnalysis(token, id).then(() => load());
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} tintColor={theme.primary} onRefresh={() => {
          setRefreshing(true);
          void load();
        }} />
      }
    >
      <Text style={styles.kicker}>Past analyses</Text>
      <Text style={styles.title}>History</Text>
      <Text style={styles.lead}>Open a saved palette or delete one you no longer need.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!rows.length ? (
        <>
          <Text style={styles.muted}>No saved analyses yet.</Text>
          <AppButton onPress={() => router.push("/analyze")}>Analyze a photo</AppButton>
        </>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <Pressable onPress={() => void open(row.id)} style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>{row.title || row.result.seasonLabel}</Text>
              <Text style={styles.muted}>
                {new Date(row.createdAt).toLocaleDateString()} · {row.result.seasonLabel}
              </Text>
            </Pressable>
            <Pressable onPress={() => remove(row.id)}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}
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
  muted: { color: theme.muted, lineHeight: 20 },
  error: { color: theme.danger },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
  },
  name: { color: theme.ink, fontWeight: "700", fontSize: 16 },
  delete: { color: theme.danger, fontWeight: "600" },
});
