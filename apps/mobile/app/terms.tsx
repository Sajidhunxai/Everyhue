import { ScrollView, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { theme } from "@/lib/theme";

const RULES = [
  "You must be old enough to use Google Play / App Store accounts in your region.",
  "Do not upload photos of others without permission.",
  "Do not abuse the API (scraping, automated spam, or reverse engineering for harm).",
  "You may delete your account at any time from the Delete account screen.",
  "We may update features; continued use means you accept the updated terms.",
] as const;

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of use</Text>
      <Text style={styles.muted}>Last updated: August 28, 2026</Text>
      <Text style={styles.lead}>
        Every Hue provides personal color and style suggestions for entertainment
        and education. Results are estimates, not professional colorimetry or
        medical advice.
      </Text>
      {RULES.map((rule) => (
        <Text key={rule} style={styles.bullet}>
          • {rule}
        </Text>
      ))}
      <Text style={styles.muted}>
        Have counsel review before a public launch.
      </Text>
      <Link href="/privacy" style={styles.link}>
        Privacy policy
      </Link>
      <Link href="/account-delete" style={styles.linkDanger}>
        Delete account
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, paddingBottom: 40 },
  title: { color: theme.ink, fontSize: 26, fontWeight: "600" },
  muted: { color: theme.dim, lineHeight: 20 },
  lead: { color: theme.muted, lineHeight: 22 },
  bullet: { color: theme.muted, lineHeight: 22, paddingLeft: 4 },
  link: { color: theme.primary, marginTop: 8 },
  linkDanger: { color: theme.danger, marginTop: 4 },
});
