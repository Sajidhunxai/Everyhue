import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { theme } from "@/lib/theme";

type Variant = "full" | "mark";
type Size = "sm" | "md" | "lg";

type Props = {
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const sizes = {
  sm: { mark: 28, every: 15, hue: 15 },
  md: { mark: 36, every: 18, hue: 18 },
  lg: { mark: 44, every: 22, hue: 22 },
} as const;

function LogoMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="22" fill="#1C2028" stroke="rgba(245,243,240,0.08)" strokeWidth="1" />
      <Path d="M24 8c-2 8-8 12-8 16s6 8 8 8 8-4 8-8-6-8-8-16z" fill="#7B9FD4" opacity="0.95" />
      <Path d="M40 24c-8 2-12 8-16 8s-8-6-8-8 4-8 8-8 8 6 16 8z" fill="#E8A87C" opacity="0.92" />
      <Path d="M24 40c2-8 8-12 8-16s-6-8-8-8-8 4-8 8 6 8 8 16z" fill="#9BC4A8" opacity="0.92" />
      <Path d="M8 24c8-2 12-8 16-8s8 6 8 8-4 8-8 8-8-6-16-8z" fill="#B8A8C8" opacity="0.9" />
      <Path d="M32 12c-4 4-4 10-6 12-2 2-8 2-10 0 2-6 6-10 10-12 4-2 8 0 6 0z" fill="#E07A7A" opacity="0.85" />
      <Circle cx="24" cy="24" r="4.5" fill="#F5F3F0" />
      <Circle cx="24" cy="24" r="2" fill="#12141A" opacity="0.35" />
    </Svg>
  );
}

function LogoWordmark({ everySize, hueSize }: { everySize: number; hueSize: number }) {
  return (
    <View style={styles.wordmark}>
      <Text style={[styles.every, { fontSize: everySize }]}>Every</Text>
      <MaskedView
        style={[styles.hueMask, { height: hueSize * 1.35 }]}
        maskElement={
          <Text style={[styles.hueMaskText, { fontSize: hueSize, lineHeight: hueSize * 1.35 }]}>
            Hue
          </Text>
        }
      >
        <LinearGradient
          colors={[theme.primary, theme.peach, theme.sage]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hueGradient}
        />
      </MaskedView>
    </View>
  );
}

export function BrandLogo({ variant = "full", size = "md", onPress, style }: Props) {
  const dim = sizes[size];
  const content = (
    <View style={[styles.root, style]}>
      <LogoMark size={dim.mark} />
      {variant === "full" ? (
        <LogoWordmark everySize={dim.every} hueSize={dim.hue} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Every Hue home">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  every: {
    color: theme.ink,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  hueMask: {
    marginLeft: 2,
  },
  hueMaskText: {
    fontWeight: "700",
    letterSpacing: -0.3,
    backgroundColor: "transparent",
    color: "#000",
  },
  hueGradient: {
    flex: 1,
    width: "100%",
    minWidth: 42,
  },
});
