import type { ReactNode } from "react";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/lib/theme";

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, contentStyle }: Props) {
  return (
    <LinearGradient colors={["#181C24", theme.bg]} style={styles.fill}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 24, gap: 12, paddingBottom: 56 },
});
