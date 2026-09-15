import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { theme } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = "primary" | "secondary" | "ghost" | "google";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

const spring = { damping: 16, stiffness: 420, mass: 0.7 };

export function AppButton({
  children,
  onPress,
  disabled,
  variant = "primary",
  style,
  fullWidth = true,
}: Props) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: 0.25 + glow.value * 0.2,
  }));

  const variantStyle =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
        ? styles.secondary
        : variant === "google"
          ? styles.google
          : styles.ghost;

  const textStyle =
    variant === "primary"
      ? styles.primaryText
      : variant === "secondary"
        ? styles.secondaryText
        : variant === "google"
          ? styles.googleText
          : styles.ghostText;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, spring);
        glow.value = withSpring(1, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
        glow.value = withSpring(0, spring);
      }}
      style={[
        styles.base,
        variantStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  fullWidth: { alignSelf: "stretch" },
  primary: {
    backgroundColor: theme.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  secondary: {
    backgroundColor: "rgba(123,159,212,0.08)",
    borderWidth: 1,
    borderColor: theme.primaryBorder,
    shadowColor: "#000",
    shadowOpacity: 0.15,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.lineStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  google: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
  },
  disabled: { opacity: 0.5 },
  primaryText: { color: theme.onPrimary, fontWeight: "700", fontSize: 16 },
  secondaryText: { color: theme.ink, fontWeight: "600", fontSize: 15 },
  ghostText: { color: theme.muted, fontWeight: "600", fontSize: 15 },
  googleText: { color: "#1f1f1f", fontWeight: "700", fontSize: 16 },
});
