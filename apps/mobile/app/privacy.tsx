import { ScrollView, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { theme } from "@/lib/theme";

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy policy</Text>
      <Text style={styles.muted}>Last updated: August 28, 2026</Text>
      <Text style={styles.lead}>
        Every Hue estimates a seasonal color palette from a photo you choose.
        We collect account info from Google (or Facebook when enabled), save your
        analysis results, wardrobe, family profiles, and stylist chat while you are
        signed in.
      </Text>
      <Text style={styles.lead}>
        Photos are used to sample colors. We do not keep uploaded images on the
        server in this version — only analysis results and account data.
      </Text>
      <Text style={styles.lead}>
        You can delete your account and all server data from Home → Delete account.
        That also signs you out on this device.
      </Text>
      <Text style={styles.muted}>
        Host this policy at a public HTTPS URL and paste that URL into Google Play
        Console Data safety. Have counsel review before launch.
      </Text>
      <Link href="/terms" style={styles.link}>
        Terms of use
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
  link: { color: theme.primary, marginTop: 8 },
  linkDanger: { color: theme.danger, marginTop: 4 },
});
