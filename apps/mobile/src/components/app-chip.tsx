import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { theme } from "@/lib/theme";
import { type } from "@/lib/type";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const spring = { damping: 16, stiffness: 420, mass: 0.7 };

type Props = {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  colorDot?: string;
};

export function AppChip({ children, selected, onPress, style, colorDot }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
      style={[styles.chip, selected && styles.on, animatedStyle, style]}
    >
      {colorDot ? <Animated.View style={[styles.dot, { backgroundColor: colorDot }]} /> : null}
      <Text style={[styles.text, selected && styles.textOn]}>{children}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    backgroundColor: theme.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  on: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryMuted,
  },
  text: { ...type.chip, color: theme.muted },
  textOn: { color: theme.ink },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
