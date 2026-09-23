import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "@/components/app-card";
import { FadeIn } from "@/components/fade-in";
import { Screen } from "@/components/screen";
import { type } from "@/lib/type";

const LINKS = [
  { href: "/match", title: "Match", desc: "Score a garment color" },
  { href: "/history", title: "History", desc: "Past analyses" },
  { href: "/quiz", title: "Style quiz", desc: "Suits and wardrobe plan" },
  { href: "/beauty", title: "Makeup & hair", desc: "Lips, eyes, jewelry, hair" },
  { href: "/try-on", title: "Look studio", desc: "Paint colors on your photo" },
  { href: "/looks", title: "Looks", desc: "Saved outfits from wardrobe" },
  { href: "/compare", title: "Compare", desc: "Pick the best-lit photo" },
  { href: "/profiles", title: "Family", desc: "Household profiles" },
  { href: "/stylist", title: "Stylist", desc: "Ask for outfit advice" },
] as const;

export default function MoreScreen() {
  return (
    <Screen>
      <FadeIn>
        <Text style={type.kicker}>Every Hue</Text>
        <Text style={type.title}>More</Text>
        <Text style={type.lead}>The rest of the studio — match, beauty, looks, family, and stylist.</Text>
      </FadeIn>
      {LINKS.map((link, i) => (
        <FadeIn key={link.href} delay={40 + i * 40}>
          <AppCard onPress={() => router.push(link.href as Href)}>
            <View style={styles.body}>
              <Text style={styles.title}>{link.title}</Text>
              <Text style={type.muted}>{link.desc}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </AppCard>
        </FadeIn>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 2 },
  title: { ...type.label, fontSize: 16, fontFamily: "Manrope_700Bold" },
  arrow: { color: "#7B9FD4", fontSize: 18, fontFamily: "Manrope_600SemiBold" },
});
