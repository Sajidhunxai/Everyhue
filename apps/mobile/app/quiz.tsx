import {
  STYLE_QUIZ_QUESTIONS,
  buildStyleQuizResult,
  emptyStyleQuizAnswers,
  isStyleQuizComplete,
} from "@photomatcher/color-engine";
import type { AnalyzeResult, StyleQuizAnswers, StyleQuizResult } from "@photomatcher/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "@/components/app-button";
import { FadeIn } from "@/components/fade-in";
import { loadLastAnalysis } from "@/lib/last-analysis";
import { theme } from "@/lib/theme";

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<StyleQuizAnswers>(emptyStyleQuizAnswers());
  const [done, setDone] = useState<StyleQuizResult | null>(null);

  useEffect(() => {
    void loadLastAnalysis().then((r) => {
      setAnalysis(r);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Style quiz</Text>
          <Text style={styles.lead}>
            Run a color analysis first — we'll use your seasonal palette to recommend
            suits, outfits, and shopping priorities.
          </Text>
          <AppButton onPress={() => router.push("/analyze")}>Analyze my colors</AppButton>
        </View>
      </ScrollView>
    );
  }

  if (done) {
    return (
      <QuizResults
        result={done}
        seasonLabel={analysis.seasonLabel}
        onRetake={() => {
          setDone(null);
          setStep(0);
          setAnswers(emptyStyleQuizAnswers());
        }}
      />
    );
  }

  const question = STYLE_QUIZ_QUESTIONS[step];
  const progress = ((step + 1) / STYLE_QUIZ_QUESTIONS.length) * 100;
  const selectedCount = question.multi ? (answers[question.id] as string[]).length : 0;

  const canContinue = question.multi
    ? (answers[question.id] as string[]).length > 0
    : Boolean(answers[question.id]);

  function finishQuiz(finalAnswers: StyleQuizAnswers) {
    if (!isStyleQuizComplete(finalAnswers) || !analysis) return;
    setDone(buildStyleQuizResult(analysis, finalAnswers));
  }

  function toggleMulti(field: "occasions" | "helpAreas", value: string, max = 3) {
    setAnswers((prev) => {
      const list = prev[field];
      if (list.includes(value)) return { ...prev, [field]: list.filter((v) => v !== value) };
      if (list.length >= max) return prev;
      return { ...prev, [field]: [...list, value] };
    });
  }

  function handleOptionPress(value: string) {
    if (question.multi) {
      toggleMulti(
        question.id as "occasions" | "helpAreas",
        value,
        question.id === "helpAreas" ? 3 : 99,
      );
      return;
    }

    const nextAnswers = { ...answers, [question.id]: value } as StyleQuizAnswers;
    setAnswers(nextAnswers);

    if (step < STYLE_QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 220);
      return;
    }

    setTimeout(() => finishQuiz(nextAnswers), 220);
  }

  function next() {
    if (step < STYLE_QUIZ_QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    finishQuiz(answers);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.seasonBadge}>{analysis.seasonLabel}</Text>
              <Text style={styles.stepLabel}>
                {step + 1} / {STYLE_QUIZ_QUESTIONS.length}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <View style={styles.dots}>
              {STYLE_QUIZ_QUESTIONS.map((_, i) => (
                <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
              ))}
            </View>
          </View>

          <FadeIn key={step}>
            <Text style={styles.title}>{question.title}</Text>
            <Text style={styles.lead}>{question.subtitle}</Text>

            {question.multi ? (
              <Text style={styles.selectionCount}>
                {question.id === "helpAreas"
                  ? `${selectedCount} of 3 selected`
                  : `${selectedCount} selected`}
              </Text>
            ) : null}

            <View style={styles.options}>
              {question.options.map((opt) => {
                const selected = question.multi
                  ? (answers[question.id] as string[]).includes(opt.value)
                  : answers[question.id] === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => handleOptionPress(opt.value)}
                  >
                    <View style={[styles.emojiWrap, selected && styles.emojiWrapSelected]}>
                      <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionLabel}>{opt.label}</Text>
                      {opt.desc ? <Text style={styles.optionDesc}>{opt.desc}</Text> : null}
                    </View>
                    <View style={[styles.check, selected && styles.checkSelected]}>
                      {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {question.multi && question.id === "helpAreas" ? (
              <Text style={styles.hint}>Tap up to 3 areas you want the most help with</Text>
            ) : null}
          </FadeIn>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step > 0 ? (
          <AppButton variant="secondary" fullWidth={false} onPress={() => setStep((s) => s - 1)}>
            Back
          </AppButton>
        ) : (
          <View style={styles.footerSpacer} />
        )}
        {question.multi ? (
          <View style={styles.footerAction}>
            <AppButton disabled={!canContinue} onPress={next}>
              {step === STYLE_QUIZ_QUESTIONS.length - 1 ? "See my plan" : "Continue"}
            </AppButton>
          </View>
        ) : (
          <Text style={styles.tapHint}>Tap an option to continue</Text>
        )}
      </View>
    </View>
  );
}

function QuizResults({
  result,
  seasonLabel,
  onRetake,
}: {
  result: StyleQuizResult;
  seasonLabel: string;
  onRetake: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.resultsContainer}>
      <View style={styles.card}>
        <FadeIn>
          <Text style={styles.kicker}>{seasonLabel} · Your style plan</Text>
          <Text style={styles.title}>{result.headline}</Text>
          <Text style={styles.lead}>{result.summary}</Text>
          <Text style={styles.personality}>{result.stylePersonality}</Text>

          <Text style={styles.section}>Suit & formal picks</Text>
          {result.suitPicks.map((s) => (
            <View key={s.title + s.detail} style={styles.resultCard}>
              <Text style={styles.badge}>{s.priority}</Text>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.muted}>{s.detail}</Text>
            </View>
          ))}

          <Text style={styles.section}>Outfits for your occasions</Text>
          {result.outfitIdeas.map((o) => (
            <View key={o.occasion + o.detail} style={styles.resultCard}>
              <Text style={styles.cardTitle}>{o.occasion}</Text>
              <Text style={styles.muted}>{o.detail}</Text>
            </View>
          ))}

          <Text style={styles.section}>Shopping priorities</Text>
          {result.shoppingList.map((s) => (
            <View key={s.item} style={styles.listRow}>
              <Text style={styles.bold}>{s.item}</Text>
              <Text style={styles.muted}>{s.why}</Text>
            </View>
          ))}

          {result.groomingTips.length > 0 ? (
            <>
              <Text style={styles.section}>Grooming & details</Text>
              {result.groomingTips.map((t) => (
                <Text key={t} style={styles.bullet}>
                  • {t}
                </Text>
              ))}
            </>
          ) : null}

          <Text style={styles.section}>Next steps</Text>
          {result.nextSteps.map((t) => (
            <Text key={t} style={styles.bullet}>
              • {t}
            </Text>
          ))}

          <AppButton onPress={() => router.push("/stylist")}>Ask AI stylist</AppButton>
          <AppButton variant="secondary" onPress={() => router.push("/shop")}>
            Shop my palette
          </AppButton>
          <AppButton variant="ghost" onPress={onRetake}>
            Retake quiz
          </AppButton>
        </FadeIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg },
  emptyContainer: { padding: 20, flexGrow: 1, justifyContent: "center" },
  container: { padding: 16, paddingTop: 8 },
  resultsContainer: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.line,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seasonBadge: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.primaryMuted,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
    overflow: "hidden",
  },
  stepLabel: { color: theme.muted, fontSize: 13, fontWeight: "600" },
  progressTrack: { height: 6, backgroundColor: theme.line, borderRadius: 999, overflow: "hidden" },
  progressBar: { height: 6, backgroundColor: theme.primary, borderRadius: 999 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  dotActive: { backgroundColor: theme.primary, transform: [{ scale: 1.15 }] },
  kicker: { color: theme.primary, textTransform: "uppercase", letterSpacing: 1, fontSize: 11, fontWeight: "700" },
  title: { color: theme.ink, fontSize: 24, fontWeight: "600", lineHeight: 30, paddingHorizontal: 16, paddingTop: 16 },
  lead: { color: theme.muted, lineHeight: 22, paddingHorizontal: 16, marginTop: 6 },
  muted: { color: theme.muted, lineHeight: 20, fontSize: 14 },
  personality: {
    color: theme.ink,
    fontStyle: "italic",
    lineHeight: 22,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    backgroundColor: theme.primaryMuted,
    borderRadius: 8,
  },
  selectionCount: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  options: { padding: 16, gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bg,
    minHeight: 72,
  },
  optionSelected: {
    borderColor: theme.primaryBorder,
    backgroundColor: theme.primaryMuted,
  },
  emojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  emojiWrapSelected: { backgroundColor: "rgba(123,159,212,0.18)" },
  optionEmoji: { fontSize: 22, lineHeight: 28 },
  optionBody: { flex: 1, gap: 4, paddingTop: 2 },
  optionLabel: { color: theme.ink, fontWeight: "600", fontSize: 16, lineHeight: 22 },
  optionDesc: { color: theme.muted, fontSize: 14, lineHeight: 20 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  checkSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkMark: { color: theme.bg, fontSize: 12, fontWeight: "700" },
  hint: { color: theme.dim, fontSize: 12, textAlign: "center", paddingHorizontal: 16, paddingBottom: 8 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: "rgba(18,20,26,0.96)",
  },
  footerSpacer: { width: 1 },
  footerAction: { flex: 1 },
  tapHint: { flex: 1, textAlign: "right", color: theme.dim, fontSize: 13 },
  section: {
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 16,
    marginHorizontal: 16,
  },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bg,
    gap: 4,
  },
  cardTitle: { color: theme.ink, fontWeight: "600", fontSize: 16 },
  badge: {
    alignSelf: "flex-start",
    color: theme.primary,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  listRow: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    gap: 4,
  },
  bullet: { color: theme.muted, lineHeight: 22, paddingHorizontal: 16, marginTop: 4 },
  bold: { color: theme.ink, fontWeight: "600" },
});
