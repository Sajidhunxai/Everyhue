import { ScrollView, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { theme } from "@/lib/theme";

const RULES = [
  "You must be 13 or older.",
  "Results are estimates for entertainment, not professional or medical advice.",
  "Do not upload photos of others without permission, or sexual / exploitative images.",
  "Look studio may send your photo to our servers and Google Gemini to recolor hair, eyes, lips, and clothes.",
  "You may delete your account anytime from Delete account.",
  "Continued use means you accept updates to these terms.",
] as const;

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of use</Text>
      <Text style={styles.muted}>Last updated: September 23, 2026</Text>
      <Text style={styles.lead}>
        Every Hue provides personal color and style suggestions for entertainment
        and education.
      </Text>
      {RULES.map((rule) => (
        <Text key={rule} style={styles.bullet}>
          • {rule}
        </Text>
      ))}
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
