import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { Redirect, Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AppButton } from "@/components/app-button";
import { FadeIn } from "@/components/fade-in";
import { useAuth } from "@/lib/auth-context";
import { isGoogleAuthConfigured } from "@/lib/google-auth-config";
import { theme } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

const SWATCHES = ["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8", "#E07A7A", "#F5F3F0"];
const BENEFITS = [
  "Personal seasonal color analysis",
  "Wardrobe & family profiles synced",
  "Delete your data anytime",
] as const;

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const { user, exchangeProviderToken, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim() ?? "";
  const googleReady = isGoogleAuthConfigured();

  const [fbRequest, fbResponse, fbPrompt] = Facebook.useAuthRequest({
    clientId: facebookAppId || "0",
  });

  useEffect(() => {
    async function finishFacebook() {
      if (fbResponse?.type !== "success") return;
      const token = fbResponse.authentication?.accessToken;
      if (!token) {
        setError("Facebook did not return an access token");
        return;
      }
      setBusy(true);
      try {
        await exchangeProviderToken("facebook", token);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Facebook sign-in failed");
      } finally {
        setBusy(false);
      }
    }
    void finishFacebook();
  }, [fbResponse, exchangeProviderToken]);

  async function onEmailSubmit() {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(trimmedEmail, password, name.trim() || undefined);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.orbs} pointerEvents="none">
        <View style={[styles.orb, styles.orbA]} />
        <View style={[styles.orb, styles.orbB]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <FadeIn>
          <View style={styles.card}>
            <BrandLogo size="lg" style={{ marginBottom: 12 }} />
            <Text style={styles.title}>
              {mode === "signup" ? "Create account" : "Welcome back"}
            </Text>
            <Text style={styles.lead}>
              {mode === "signup"
                ? "Sign up with email to save palettes and wardrobe across devices."
                : "Sign in to save palettes, wardrobe items, and family profiles. We never sell your photos."}
            </Text>

            {mode === "signin"
              ? BENEFITS.map((b, i) => (
                  <FadeIn key={b} delay={80 + i * 60}>
                    <Text style={styles.benefit}>• {b}</Text>
                  </FadeIn>
                ))
              : null}

            <FadeIn delay={200}>
              <View style={styles.swatchRow}>
                {SWATCHES.map((hex) => (
                  <View key={hex} style={[styles.swatch, { backgroundColor: hex }]} />
                ))}
              </View>
            </FadeIn>

            {busy ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FadeIn delay={240}>
              <View style={styles.form}>
                {mode === "signup" ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Name (optional)"
                    placeholderTextColor={theme.dim}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!busy}
                  />
                ) : null}
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={theme.dim}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!busy}
                />
                <TextInput
                  style={styles.input}
                  placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
                  placeholderTextColor={theme.dim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType={mode === "signup" ? "newPassword" : "password"}
                  editable={!busy}
                />
                <AppButton disabled={busy} onPress={onEmailSubmit}>
                  {mode === "signup" ? "Create account" : "Sign in with email"}
                </AppButton>
                <Pressable
                  disabled={busy}
                  onPress={() => {
                    setError(null);
                    setMode(mode === "signin" ? "signup" : "signin");
                  }}
                >
                  <Text style={styles.switchMode}>
                    {mode === "signin"
                      ? "New here? Create an account"
                      : "Already have an account? Sign in"}
                  </Text>
                </Pressable>
              </View>
            </FadeIn>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <FadeIn delay={320}>
              {googleReady ? (
                <GoogleSignInButton
                  busy={busy}
                  onBusyChange={setBusy}
                  onError={setError}
                />
              ) : (
                <Text style={styles.muted}>Google sign-in not configured — use email above.</Text>
              )}
            </FadeIn>

            {facebookAppId ? (
              <FadeIn delay={380}>
                <Pressable
                  style={[styles.btn, styles.facebook]}
                  disabled={!fbRequest || busy}
                  onPress={() => fbPrompt()}
                >
                  <Text style={styles.facebookText}>Continue with Facebook</Text>
                </Pressable>
              </FadeIn>
            ) : null}

            <Text style={styles.legal}>
              By signing in you agree to our{" "}
              <Link href="/terms" style={styles.legalLink}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" style={styles.legalLink}>
                Privacy policy
              </Link>
              .
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  orbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  orb: { position: "absolute", borderRadius: 999 },
  orbA: {
    width: 220,
    height: 220,
    top: -40,
    left: -50,
    backgroundColor: "rgba(123,159,212,0.25)",
  },
  orbB: {
    width: 180,
    height: 180,
    bottom: 60,
    right: -40,
    backgroundColor: "rgba(232,168,124,0.18)",
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  back: { alignSelf: "flex-start", marginBottom: 12 },
  backText: { color: theme.muted, fontSize: 15 },
  card: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 20,
    padding: 22,
    gap: 10,
    backgroundColor: "rgba(28,32,40,0.92)",
  },
  title: { color: theme.ink, fontSize: 28, fontWeight: "600" },
  lead: { color: theme.muted, lineHeight: 22 },
  benefit: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 4 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.line,
  },
  form: { gap: 10, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    backgroundColor: "rgba(18,20,26,0.65)",
    fontSize: 16,
  },
  switchMode: {
    color: theme.primary,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.line },
  dividerText: { color: theme.dim, fontSize: 12, textTransform: "uppercase" },
  loader: { marginVertical: 4 },
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  facebook: { backgroundColor: "#1877F2" },
  facebookText: { color: "#fff", fontWeight: "700" },
  error: { color: theme.danger, textAlign: "center", lineHeight: 20 },
  muted: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  legal: {
    color: theme.dim,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
  legalLink: { color: theme.primary },
});
