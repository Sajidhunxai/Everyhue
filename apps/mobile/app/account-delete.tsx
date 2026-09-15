import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { getApiBaseUrl } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";

export default function AccountDeleteScreen() {
  const { user, accessToken, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Redirect href="/login" />;

  async function deleteAccount() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok && res.status !== 401) {
        throw new Error(await res.text());
      }
      await signOut();
      router.replace("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete account</Text>
      <Text style={styles.lead}>
        This permanently deletes your analyses, wardrobe, family profiles, and
        stylist chat on the server, then signs you out on this device.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? <ActivityIndicator color="#7B9FD4" /> : null}
      <Pressable style={styles.primary} disabled={busy} onPress={deleteAccount}>
        <Text style={styles.primaryText}>Delete account &amp; sign out</Text>
      </Pressable>
      <Pressable style={styles.secondary} disabled={busy} onPress={() => router.back()}>
        <Text style={styles.secondaryText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { color: "#F5F3F0", fontSize: 26, fontWeight: "600" },
  lead: { color: "#A8AEB8", lineHeight: 22 },
  error: { color: "#E07A7A" },
  primary: {
    backgroundColor: "#E07A7A",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "#12141A", fontWeight: "700" },
  secondary: {
    borderWidth: 1,
    borderColor: "rgba(245,243,240,0.2)",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryText: { color: "#F5F3F0" },
});
