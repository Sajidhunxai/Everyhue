import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { FadeIn } from "@/components/fade-in";
import { getApiBaseUrl } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

type Item = { id: string; hex: string; name: string; category: string };

const PRESETS = ["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8", "#E07A7A", "#F5F3F0", "#2C3440", "#C4A574"];

export default function WardrobeScreen() {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#7B9FD4");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/wardrobe`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        setError("Could not load wardrobe");
        return;
      }
      setItems((await res.json()) as Item[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user || !accessToken) return <Redirect href="/login" />;

  async function add() {
    if (!accessToken || !name.trim()) {
      setError("Enter an item name.");
      return;
    }
    const color = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#7B9FD4";
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/wardrobe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hex: color, name: name.trim(), category: "General" }),
      });
      if (!res.ok) {
        setError("Could not add item");
        return;
      }
      setName("");
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await fetch(`${getApiBaseUrl()}/api/wardrobe?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    void load();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
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
      <FadeIn>
        <Text style={styles.kicker}>Closet</Text>
        <Text style={styles.title}>Wardrobe</Text>
        <Text style={styles.lead}>
          Save garment colors you own so the stylist can work with what you already wear.
        </Text>
      </FadeIn>

      {!showForm ? (
        <AppButton onPress={() => setShowForm(true)}>Add item</AppButton>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>New item</Text>
          <TextInput
            style={styles.input}
            placeholder="Item name"
            placeholderTextColor={theme.dim}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text style={styles.fieldLabel}>Color</Text>
          <View style={styles.swatchRow}>
            {PRESETS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setHex(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  hex.toUpperCase() === c.toUpperCase() && styles.swatchActive,
                ]}
              />
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="#7B9FD4"
            placeholderTextColor={theme.dim}
            value={hex}
            onChangeText={setHex}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton disabled={saving} onPress={add}>
            {saving ? "Saving…" : "Save item"}
          </AppButton>
          <AppButton
            variant="ghost"
            disabled={saving}
            onPress={() => {
              setShowForm(false);
              setError(null);
            }}
          >
            Cancel
          </AppButton>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Wardrobe is empty</Text>
          <Text style={styles.lead}>Add a few pieces you wear often to get better outfit tips.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>
            {items.length} item{items.length === 1 ? "" : "s"}
          </Text>
          <View style={styles.list}>
            {items.map((i) => (
              <View key={i.id} style={styles.card}>
                <View style={[styles.dot, { backgroundColor: i.hex }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.name}>{i.name}</Text>
                  <Text style={styles.meta}>{i.hex.toUpperCase()}</Text>
                </View>
                <Pressable onPress={() => remove(i.id)}>
                  <Text style={styles.actionDanger}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}

      {!showForm && error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 24, gap: 12, paddingBottom: 48 },
  kicker: {
    color: theme.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  title: { color: theme.ink, fontSize: 26, fontWeight: "600", lineHeight: 32 },
  lead: { color: theme.muted, lineHeight: 22, fontSize: 15 },
  sectionLabel: {
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
  },
  formCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
  },
  fieldLabel: { color: theme.muted, fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: theme.ink,
    backgroundColor: "rgba(18,20,26,0.55)",
    fontSize: 16,
  },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.line,
  },
  swatchActive: {
    borderColor: theme.ink,
    borderWidth: 2,
  },
  empty: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    gap: 6,
  },
  emptyTitle: { color: theme.ink, fontSize: 17, fontWeight: "600" },
  list: { gap: 10 },
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
  dot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.line,
  },
  cardBody: { flex: 1, gap: 2 },
  name: { color: theme.ink, fontWeight: "600", fontSize: 16 },
  meta: { color: theme.muted, fontSize: 13 },
  actionDanger: { color: theme.danger, fontWeight: "600", fontSize: 13 },
  error: { color: theme.danger, fontSize: 14 },
});
