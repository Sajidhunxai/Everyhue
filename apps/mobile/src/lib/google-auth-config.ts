import Constants from "expo-constants";
import { Platform } from "react-native";

export type GoogleAuthEnv = {
  webClientId: string;
  androidClientId: string;
  iosClientId: string;
};

/** True when running inside the Expo Go app (Google native sign-in is not supported). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function getGoogleAuthEnv(): GoogleAuthEnv {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "",
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "",
  };
}

export function isGoogleAuthConfigured(): boolean {
  const { webClientId, iosClientId } = getGoogleAuthEnv();
  if (Platform.OS === "android") return Boolean(webClientId);
  if (Platform.OS === "ios") return Boolean(iosClientId || webClientId);
  return Boolean(webClientId);
}

export function googleAuthSetupHint(): string {
  if (isExpoGo()) {
    return (
      "Google Sign-In does not work in Expo Go. Install the Every Hue APK (pnpm build:apk:local) " +
      "or open the web app in your phone browser. See GOOGLE_AUTH.md."
    );
  }
  if (Platform.OS === "android") {
    return (
      "Android setup (Google Cloud Console):\n" +
      "1) OAuth consent screen → Test users → add your Gmail\n" +
      "2) Android OAuth client → package com.asktheimageguru.everyhue + debug SHA-1\n" +
      "   Run: pnpm --filter @photomatcher/mobile print:sha1\n" +
      "3) Web OAuth client — only http://localhost:3000/... (NOT photomatcher://)\n" +
      "See GOOGLE_AUTH.md."
    );
  }
  return "Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to apps/mobile/.env.";
}

export function googlePolicyErrorHint(): string {
  return (
    "Google OAuth 400 usually means:\n" +
    "1) Expo Go — use the installed APK instead;\n" +
    "2) Your Gmail is not a Test user (OAuth consent screen → Testing);\n" +
    "3) Debug SHA-1 missing on the Android OAuth client (not the Web client).\n\n" +
    "Do NOT add photomatcher:// to the Web client — Google rejects custom schemes.\n" +
    "Run: pnpm --filter @photomatcher/mobile print:sha1\n\n" +
    "See GOOGLE_AUTH.md."
  );
}
