import { AppButton } from "@/components/app-button";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/lib/config";
import {
  getGoogleAuthEnv,
  googleAuthSetupHint,
  isExpoGo,
} from "@/lib/google-auth-config";

type Props = {
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
};

export function GoogleSignInButton({ busy, onBusyChange, onError }: Props) {
  const { exchangeProviderToken } = useAuth();
  const { webClientId } = getGoogleAuthEnv();
  const [configured, setConfigured] = useState(false);
  const inExpoGo = isExpoGo();

  useEffect(() => {
    if (inExpoGo || !webClientId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GoogleSignin } = require("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
        scopes: ["email", "profile"],
      });
      setConfigured(true);
    } catch {
      setConfigured(false);
    }
  }, [inExpoGo, webClientId]);

  const signInNative = useCallback(async () => {
    if (inExpoGo) {
      onError(googleAuthSetupHint());
      return;
    }
    if (!webClientId) {
      onError("Google sign-in is not configured.");
      return;
    }

    onBusyChange(true);
    onError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GoogleSignin } = require("@react-native-google-signin/google-signin");
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type === "cancelled") return;

      const tokens = await GoogleSignin.getTokens();
      if (tokens.idToken) {
        await exchangeProviderToken("google", undefined, tokens.idToken);
      } else if (tokens.accessToken) {
        await exchangeProviderToken("google", tokens.accessToken);
      } else {
        throw new Error("Google did not return a token");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      if (
        msg.includes("DEVELOPER_ERROR") ||
        msg.includes("400") ||
        msg.includes("10:") ||
        msg.includes("12500")
      ) {
        onError(
          "Google sign-in needs setup (test user + Android SHA-1). Use email below, or see GOOGLE_AUTH.md.",
        );
      } else {
        onError(msg);
      }
    } finally {
      onBusyChange(false);
    }
  }, [inExpoGo, webClientId, exchangeProviderToken, onBusyChange, onError]);

  const openWebApp = useCallback(() => {
    void Linking.openURL(`${getApiBaseUrl()}/login`);
  }, []);

  if (inExpoGo) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Google Sign-In unavailable in Expo Go</Text>
        <Text style={styles.noticeText}>Use email below, or open the web app.</Text>
        <AppButton variant="secondary" onPress={openWebApp} style={styles.mt8}>
          Open web app to sign in
        </AppButton>
      </View>
    );
  }

  return (
    <AppButton
      variant="google"
      disabled={!configured || busy || !webClientId}
      onPress={signInNative}
    >
      Continue with Google
    </AppButton>
  );
}

const styles = StyleSheet.create({
  mt8: { marginTop: 8 },
  notice: {
    borderWidth: 1,
    borderColor: theme.primaryBorder,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    backgroundColor: theme.primaryMuted,
  },
  noticeTitle: { color: theme.primary, fontWeight: "700" },
  noticeText: { color: theme.muted, lineHeight: 20, fontSize: 13 },
});
