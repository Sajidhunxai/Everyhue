import "@/lib/suppress-dev-noise";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "@/lib/auth-context";
import { theme } from "@/lib/theme";
import { useAppFonts } from "@/lib/use-app-fonts";

if (__DEV__) {
  LogBox.ignoreLogs([
    "Unable to activate keep awake",
    "Unable to deactivate keep awake",
  ]);
}

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.ink,
          headerTitleStyle: { fontFamily: "Fraunces_600SemiBold", fontSize: 18 },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ title: "Style quiz" }} />
        <Stack.Screen name="match" options={{ title: "Match" }} />
        <Stack.Screen name="history" options={{ title: "History" }} />
        <Stack.Screen name="beauty" options={{ title: "Makeup & hair" }} />
        <Stack.Screen name="try-on" options={{ title: "Look studio" }} />
        <Stack.Screen name="looks" options={{ title: "Looks" }} />
        <Stack.Screen name="results" options={{ title: "Results" }} />
        <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
        <Stack.Screen name="terms" options={{ title: "Terms" }} />
        <Stack.Screen name="account-delete" options={{ title: "Delete account" }} />
      </Stack>
    </AuthProvider>
  );
}
