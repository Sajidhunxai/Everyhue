import type { SavedLook, WardrobeItem } from "@photomatcher/types";
import { Link, Redirect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppButton } from "@/components/app-button";
import { useAuth } from "@/lib/auth-context";
import { createLook, deleteLook, listLooks, listWardrobe } from "@/lib/looks-api";
import { theme } from "@/lib/theme";

const OCCASIONS = [
  "Everyday",
  "Work",
  "Interview",
  "Date",
  "Wedding",
  "Travel",
  "Formal",
  "Casual",
] as const;

export default function LooksScreen() {
  const { user, accessToken } = useAuth();
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number]>("Everyday");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const [nextLooks, nextItems] = await Promise.all([
        listLooks(accessToken),
        listWardrobe(accessToken),
      ]);
      setLooks(nextLooks);
      setItems(nextItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load looks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewHexes = useMemo(
    () => items.filter((item) => selected.includes(item.id)).map((item) => item.hex),
    [items, selected],
  );

  if (!user || !accessToken) return <Redirect href="/login" />;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(0, 8),
    );
  }

  async function save() {
    if (!accessToken) return;
    if (!name.trim() || !selected.length) {
      setError("Add a look name and pick at least one wardrobe color.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createLook(accessToken, { name: name.trim(), occasion, itemIds: selected });
      setName("");
      setSelected([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save look");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await deleteLook(accessToken, id);
    await load();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={theme.primary}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      <Text style={styles.title}>Saved looks</Text>
      <Text style={styles.lead}>
        Combine wardrobe colors into named outfits. We score them against your latest seasonal palette.
      </Text>

      {loading ? <ActivityIndicator color={theme.primary} /> : null}

      <TextInput
        style={styles.input}
        placeholder="Look name"
        placeholderTextColor={theme.dim}
        value={name}
        onChangeText={setName}
        maxLength={80}
      />

      <Text style={styles.section}>Occasion</Text>
      <View style={styles.chipRow}>
        {OCCASIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setOccasion(option)}
            style={[styles.chip, occasion === option && styles.chipOn]}
          >
            <Text style={[styles.chipText, occasion === option && styles.chipTextOn]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Wardrobe pieces</Text>
      {items.length ? (
        <View style={styles.chipRow}>
          {items.map((item) => {
            const on = selected.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggle(item.id)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <View style={[styles.dot, { backgroundColor: item.hex }]} />
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <>
          <Text style={styles.lead}>Save colors in Wardrobe first, then build a look.</Text>
          <Link href="/wardrobe" style={styles.link}>
            Open wardrobe →
          </Link>
        </>
      )}

      {previewHexes.length ? (
        <View style={styles.swatchRow}>
          {previewHexes.map((hex) => (
            <View key={hex} style={[styles.swatch, { backgroundColor: hex }]} />
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton onPress={() => void save()} disabled={busy}>
        {busy ? "Saving…" : "Save look"}
      </AppButton>

      {looks.map((look) => (
        <View key={look.id} style={styles.card}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.cardTitle}>{look.name}</Text>
            <Text style={styles.lead}>
              {look.occasion}
              {look.score != null ? ` · ${look.score}% palette match` : ""}
            </Text>
            <View style={styles.swatchRow}>
              {look.hexes.map((hex, index) => (
                <View key={`${look.id}-${hex}-${index}`} style={[styles.dotLg, { backgroundColor: hex }]} />
              ))}
            </View>
          </View>
          <Pressable onPress={() => void remove(look.id)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 24, gap: 10, paddingBottom: 48 },
  title: { color: theme.ink, fontSize: 28, fontFamily: "Fraunces_600SemiBold" },
  lead: { color: theme.muted, lineHeight: 22, fontFamily: "Manrope_400Regular" },
  section: { color: theme.ink, fontSize: 16, fontFamily: "Manrope_600SemiBold", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    backgroundColor: theme.surface,
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { borderColor: theme.primary, backgroundColor: theme.primaryMuted },
  chipText: { color: theme.muted, fontSize: 13 },
  chipTextOn: { color: theme.ink, fontWeight: "600" },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotLg: { width: 18, height: 18, borderRadius: 9 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { width: 36, height: 36, borderRadius: 8 },
  error: { color: theme.danger },
  card: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardTitle: { color: theme.ink, fontWeight: "700", fontSize: 16 },
  remove: { color: theme.danger, fontWeight: "600" },
  link: { color: theme.primary, fontWeight: "600" },
});
