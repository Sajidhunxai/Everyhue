import { stylistReply } from "@photomatcher/color-engine";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppButton } from "@/components/app-button";
import { loadLastAnalysis, stylistContextFromResult } from "@/lib/last-analysis";
import { askStylist, loadStylistHistory, type ChatMessage } from "@/lib/stylist-api";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

export default function StylistScreen() {
  const { user, accessToken } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<"ai" | "rules" | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void loadStylistHistory(accessToken).then((history) => {
      if (history.length) setMessages(history);
      else {
        setMessages([
          {
            role: "assistant",
            content: "Ask me about suits, casual wear, makeup, jewelry, or what to wear for an occasion.",
          },
        ]);
      }
    });
  }, [accessToken]);

  if (!user || !accessToken) return <Redirect href="/login" />;

  async function send() {
    const text = input.trim();
    if (!text || !accessToken) return;
    setInput("");
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const last = await loadLastAnalysis();
      const context = last
        ? stylistContextFromResult(last)
        : {
            seasonLabel: "Deep Winter",
            undertone: "cool",
            palette: [{ hex: "#0B0F14", name: "Midnight" }],
            neutrals: ["Black"],
          };
      try {
        const { reply, mode } = await askStylist(accessToken, text, context);
        if (mode) setChatMode(mode);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch {
        const reply = stylistReply(text, context);
        setChatMode("rules");
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get a reply");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Advice</Text>
      <Text style={styles.title}>Stylist</Text>
      <Text style={styles.lead}>
        {chatMode === "ai"
          ? "Answers use your palette and chat history."
          : "Ask about jewelry, suits, casual wear, or what to wear for an occasion."}
      </Text>
      {messages.map((m, i) => (
        <View key={`${m.role}-${i}`} style={m.role === "user" ? styles.userBubble : styles.botBubble}>
          <Text style={m.role === "user" ? styles.userText : styles.botText}>{m.content}</Text>
        </View>
      ))}
      {busy ? <ActivityIndicator color={theme.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="What should I wear? Jewelry tips?"
        placeholderTextColor={theme.dim}
        editable={!busy}
      />
      <AppButton onPress={send} disabled={busy}>
        Ask stylist
      </AppButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 24, gap: 10, paddingBottom: 48 },
  kicker: {
    color: theme.primary,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
  },
  title: { color: theme.ink, fontSize: 28, fontFamily: "Fraunces_600SemiBold" },
  lead: { color: theme.muted, lineHeight: 20, fontSize: 14, fontFamily: "Manrope_400Regular" },
  input: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: 12,
    padding: 12,
    color: theme.ink,
    backgroundColor: theme.surface,
    fontFamily: "Manrope_400Regular",
    marginTop: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.primaryMuted,
    padding: 12,
    borderRadius: 14,
    maxWidth: "85%",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
    borderRadius: 14,
    maxWidth: "85%",
  },
  userText: { color: theme.ink },
  botText: { color: theme.muted, lineHeight: 20 },
  error: { color: theme.danger },
});
