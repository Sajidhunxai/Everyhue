import type { ReactNode } from "react";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

type Props = {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down";
  style?: object;
};

export function FadeIn({ children, delay = 0, direction = "up", style }: Props) {
  const entering =
    direction === "down"
      ? FadeInDown.delay(delay).duration(480).springify().damping(18)
      : FadeInUp.delay(delay).duration(480).springify().damping(18);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
