import type { ReactNode } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { theme } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const spring = { damping: 16, stiffness: 380, mass: 0.7 };

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, onPress, style }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
      style={[styles.card, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
});
