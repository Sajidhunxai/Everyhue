import { Redirect, router } from "expo-router";
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

type Profile = { id: string; name: string; relation: string };

const RELATIONS = ["Family", "Partner", "Child", "Parent", "Sibling", "Friend"] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ProfilesScreen() {
  const { user, accessToken } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string>("Family");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/profiles`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        setError("Could not load profiles");
        return;
      }
      setProfiles((await res.json()) as Profile[]);
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
      setError("Enter a name for this profile.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/profiles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          relation: relation.trim() || "Family",
        }),
      });
      if (!res.ok) {
        setError("Could not add profile");
        return;
      }
      setName("");
      setRelation("Family");
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await fetch(`${getApiBaseUrl()}/api/profiles?id=${id}`, {
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
        <Text style={styles.kicker}>Household</Text>
        <Text style={styles.title}>Family profiles</Text>
        <Text style={styles.lead}>
          Save analyses for partners, kids, and others — each keeps their own palette.
        </Text>
      </FadeIn>

      {!showForm ? (
        <FadeIn delay={60}>
          <AppButton onPress={() => setShowForm(true)}>Add profile</AppButton>
        </FadeIn>
      ) : (
        <FadeIn delay={40}>
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>New profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={theme.dim}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Text style={styles.fieldLabel}>Relation</Text>
            <View style={styles.chipRow}>
              {RELATIONS.map((r) => {
                const active = relation === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRelation(r)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton disabled={saving} onPress={add}>
              {saving ? "Saving…" : "Save profile"}
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
        </FadeIn>
      )}

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
      ) : profiles.length === 0 ? (
        <FadeIn delay={100}>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No profiles yet</Text>
            <Text style={styles.lead}>
              Add someone in your household to run analyses under their name.
            </Text>
          </View>
        </FadeIn>
      ) : (
        <FadeIn delay={80}>
          <Text style={styles.sectionLabel}>
            {profiles.length} profile{profiles.length === 1 ? "" : "s"}
          </Text>
          <View style={styles.list}>
            {profiles.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(p.name)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>{p.relation}</Text>
                </View>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/analyze",
                      params: { profileId: p.id },
                    })
                  }
                >
                  <Text style={styles.actionPrimary}>Analyze</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => remove(p.id)}>
                  <Text style={styles.actionDanger}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </FadeIn>
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
    marginTop: 8,
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.lineStrong,
  },
  chipActive: {
    backgroundColor: theme.primaryMuted,
    borderColor: theme.primaryBorder,
  },
  chipText: { color: theme.muted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: theme.ink },
  empty: {
    marginTop: 8,
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
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primaryMuted,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: theme.primary, fontWeight: "700", fontSize: 13 },
  cardBody: { flex: 1, gap: 2, minWidth: 0 },
  name: { color: theme.ink, fontWeight: "600", fontSize: 16 },
  meta: { color: theme.muted, fontSize: 13 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  actionPrimary: { color: theme.primary, fontWeight: "600", fontSize: 13 },
  actionDanger: { color: theme.danger, fontWeight: "600", fontSize: 13 },
  error: { color: theme.danger, fontSize: 14 },
});
