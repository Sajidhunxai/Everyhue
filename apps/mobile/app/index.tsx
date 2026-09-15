import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Personal color analysis</Text>
      <Text style={styles.title}>Find colors that belong with you</Text>
      <Text style={styles.lead}>
        Use daylight and a clear face photo. We prefer on-device Lab sampling so
        your image can stay on the phone.
      </Text>
      {user ? (
        <>
          <Text style={styles.muted}>Signed in as {user.name ?? user.email}</Text>
          <Link href="/analyze" asChild>
            <Pressable style={styles.primary}>
              <Text style={styles.primaryText}>Start analysis</Text>
            </Pressable>
          </Link>
          <Pressable onPress={signOut} style={styles.secondary}>
            <Text style={styles.secondaryText}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <Link href="/login" asChild>
          <Pressable style={styles.primary}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </Link>
      )}
      <Link href="/privacy" style={styles.link}>
        Privacy
      </Link>
      <Link href="/account-delete" style={styles.link}>
        Delete account
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  kicker: { color: "#C4B5A5", textTransform: "uppercase", letterSpacing: 1, fontSize: 12 },
  title: { color: "#F7F1EA", fontSize: 34, fontWeight: "600", lineHeight: 40 },
  lead: { color: "#C4B5A5", lineHeight: 22, marginBottom: 8 },
  muted: { color: "#C4B5A5" },
  primary: {
    backgroundColor: "#E8A87C",
    paddingVertical: 14,
    paddingHorizontal: 18,
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
  link: { color: "#E8A87C", marginTop: 4 },
});
