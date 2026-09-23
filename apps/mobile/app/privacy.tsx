import { Linking, ScrollView, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { theme } from "@/lib/theme";

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy policy</Text>
      <Text style={styles.muted}>Last updated: September 23, 2026</Text>
      <Text style={styles.lead}>
        Every Hue is for people 13 and older. We collect your name and email when
        you sign in, plus the photos you choose for analysis and Look studio, and
        the palettes, wardrobe, family profiles, and chat you save.
      </Text>
      <Text style={styles.lead}>
        Photos may be stored with your analysis and sent to our servers. Look
        studio may send a portrait to Google Gemini (and sometimes another image
        model) to recolor hair, eyes, lips, and clothes. Stylist chat may be sent
        to OpenAI if that feature is on. We do not sell your data or show ads.
      </Text>
      <Text style={styles.lead}>
        Delete everything on the server from Home → Delete account, or on the web
        at asktheimageguru.com/account/delete.
      </Text>
      <Text
        style={styles.link}
        onPress={() => void Linking.openURL("https://www.asktheimageguru.com/privacy")}
      >
        Full policy on the website
      </Text>
      <Text
        style={styles.link}
        onPress={() => void Linking.openURL("mailto:support@asktheimageguru.com")}
      >
        support@asktheimageguru.com
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
