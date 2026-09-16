"use client";

import {
  STYLE_QUIZ_QUESTIONS,
  buildStyleQuizResult,
  emptyStyleQuizAnswers,
  isStyleQuizComplete,
} from "@photomatcher/color-engine";
import type { AnalyzeResult, StyleQuizAnswers, StyleQuizPayload, QuizTemplate } from "@photomatcher/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import {
  addLocalQuiz,
  loadLocalQuizHistory,
  mergeQuizHistory,
  removeLocalQuiz,
} from "@/lib/quiz-history";
import { startRouteProgress, finishRouteProgress } from "@/lib/route-progress";

type Props = {
  analysis: AnalyzeResult;
};

type Screen = "gate" | "quiz" | "custom" | "results";

export function StyleQuizFlow({ analysis }: Props) {
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("gate");
  const [history, setHistory] = useState<StyleQuizPayload[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<StyleQuizAnswers>(emptyStyleQuizAnswers());
  const [done, setDone] = useState<StyleQuizPayload | null>(null);
  const [ready, setReady] = useState(false);
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [custom, setCustom] = useState<QuizTemplate | null>(null);
  const [customStep, setCustomStep] = useState(0);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>({});

  const question = STYLE_QUIZ_QUESTIONS[step];
  const progress = screen === "results" ? 100 : ((step + 1) / STYLE_QUIZ_QUESTIONS.length) * 100;

  useEffect(() => {
    startRouteProgress();
    void (async () => {
      const local = loadLocalQuizHistory();
      let remote: StyleQuizPayload[] = [];
      let published: QuizTemplate[] = [];
      try {
        const [quizRes, templateRes] = await Promise.all([
          fetch("/api/quizzes", { credentials: "include" }),
          fetch("/api/quiz-templates"),
        ]);
        if (quizRes.ok) remote = (await quizRes.json()) as StyleQuizPayload[];
        if (templateRes.ok) published = (await templateRes.json()) as QuizTemplate[];
      } catch {
        remote = [];
      }
      setTemplates(published);
      const merged = mergeQuizHistory(remote, local);
      setHistory(merged);
      setScreen(merged.length || published.length ? "gate" : "quiz");
      setReady(true);
      finishRouteProgress();
    })();
  }, []);

  const toggleMulti = useCallback((field: "occasions" | "helpAreas", value: string, max = 3) => {
    setAnswers((prev) => {
      const list = prev[field];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter((v) => v !== value) };
      }
      if (list.length >= max) return prev;
      return { ...prev, [field]: [...list, value] };
    });
  }, []);

  const canContinue = useMemo(() => {
    if (!question) return false;
    if (question.multi) {
      const list = answers[question.id] as string[];
      return list.length > 0;
    }
    return Boolean(answers[question.id]);
  }, [answers, question]);

  async function persistQuiz(payload: StyleQuizPayload) {
    addLocalQuiz(payload);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = (await res.json()) as StyleQuizPayload;
        setHistory((current) => mergeQuizHistory([saved], current));
        setDone(saved);
        return;
      }
    } catch {
      /* local history still keeps it */
    }
    setHistory((current) => mergeQuizHistory([payload], current));
  }

  function finishQuiz(finalAnswers: StyleQuizAnswers) {
    if (!isStyleQuizComplete(finalAnswers)) return;
    const result = buildStyleQuizResult(analysis, finalAnswers);
    const payload: StyleQuizPayload = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      quizTitle: "Seasonal style quiz",
      answers: finalAnswers,
      result,
      seasonLabel: analysis.seasonLabel,
      completedAt: new Date().toISOString(),
    };
    setDone(payload);
    setScreen("results");
    toast("Style quiz saved");
    void persistQuiz(payload);
  }

  function next() {
    if (step < STYLE_QUIZ_QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    finishQuiz(answers);
  }

  function startNewQuiz() {
    setDone(null);
    setCustom(null);
    setStep(0);
    setAnswers(emptyStyleQuizAnswers());
    setScreen("quiz");
  }

  function startCustom(template: QuizTemplate) {
    setCustom(template);
    setCustomStep(0);
    setCustomAnswers({});
    setScreen("custom");
  }

  function finishCustom() {
    if (!custom) return;
    const payload: StyleQuizPayload = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      quizTitle: custom.title,
      templateId: custom.id,
      answers: customAnswers,
      result: {
        headline: custom.resultTitle,
        summary: custom.resultBody,
        stylePersonality: `Completed “${custom.title}”.`,
        suitPicks: [],
        outfitIdeas: [],
        shoppingList: [],
        groomingTips: [],
        nextSteps: ["Open another quiz from Your style plans", "Ask the stylist if you want outfit help"],
      },
      seasonLabel: analysis.seasonLabel,
      completedAt: new Date().toISOString(),
    };
    setDone(payload);
    setScreen("results");
    toast("Quiz saved");
    void persistQuiz(payload);
  }

  function openSaved(payload: StyleQuizPayload) {
    setDone(payload);
    setScreen("results");
  }

  async function deleteSaved(id: string) {
    const ok = window.confirm("Delete this style plan?");
    if (!ok) return;
    setHistory(removeLocalQuiz(id));
    if (done?.id === id) {
      setDone(null);
      setScreen("gate");
    }
    await fetch(`/api/quizzes?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    toast("Style plan deleted");
  }

  function handleOptionClick(value: string) {
    if (question.multi) {
      toggleMulti(question.id as "occasions" | "helpAreas", value, question.id === "helpAreas" ? 3 : 99);
      return;
    }

    const nextAnswers = { ...answers, [question.id]: value } as StyleQuizAnswers;
    setAnswers(nextAnswers);

    if (step < STYLE_QUIZ_QUESTIONS.length - 1) {
      window.setTimeout(() => setStep((s) => s + 1), 220);
      return;
    }

    window.setTimeout(() => finishQuiz(nextAnswers), 220);
  }

  if (!ready) {
    return <div className="quiz-page" aria-busy="true" />;
  }

  if (screen === "gate") {
    return (
      <QuizGate
        seasonLabel={analysis.seasonLabel}
        history={history}
        templates={templates}
        onNew={startNewQuiz}
        onCustom={startCustom}
        onOpen={openSaved}
        onDelete={(id) => void deleteSaved(id)}
      />
    );
  }

  if (screen === "results" && done) {
    return (
      <QuizResults payload={done} onRetake={startNewQuiz} onHistory={() => setScreen(history.length || templates.length ? "gate" : "quiz")} />
    );
  }

  if (screen === "custom" && custom) {
    return (
      <CustomQuizRunner
        template={custom}
        step={customStep}
        answers={customAnswers}
        onBack={() => {
          if (customStep === 0) setScreen("gate");
          else setCustomStep((s) => s - 1);
        }}
        onAnswers={setCustomAnswers}
        onStep={setCustomStep}
        onFinish={finishCustom}
      />
    );
  }

  const selectedCount = question.multi ? (answers[question.id] as string[]).length : 0;

  return (
    <div className="quiz-shell">
      <div className="quiz-card anim-fade-up">
        <header className="quiz-header">
          <div className="quiz-header-top">
            <span className="quiz-season-badge">{analysis.seasonLabel}</span>
            <span className="quiz-step-label">
              {step + 1} / {STYLE_QUIZ_QUESTIONS.length}
            </span>
          </div>
          <div className="quiz-progress" aria-hidden="true">
            <span className="quiz-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="quiz-dots" aria-hidden="true">
            {STYLE_QUIZ_QUESTIONS.map((_, i) => (
              <span key={i} className={`quiz-dot ${i <= step ? "quiz-dot-active" : ""}`} />
            ))}
          </div>
        </header>

        <div className="quiz-body">
          <h1 className="quiz-question-title">{question.title}</h1>
          <p className="quiz-question-sub">{question.subtitle}</p>

          {question.multi ? (
            <p className="quiz-selection-count">
              {question.id === "helpAreas" ? `${selectedCount} of 3 selected` : `${selectedCount} selected`}
            </p>
          ) : null}

          <div
            className={`quiz-options ${question.multi ? "quiz-options-multi" : ""}`}
            role={question.multi ? "group" : "radiogroup"}
            aria-label={question.title}
          >
            {question.options.map((opt) => {
              const selected = question.multi
                ? (answers[question.id] as string[]).includes(opt.value)
                : answers[question.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role={question.multi ? "checkbox" : "radio"}
                  aria-checked={selected}
                  className={`quiz-option ${selected ? "quiz-option-selected" : ""}`}
                  onClick={() => handleOptionClick(opt.value)}
                >
                  <span className="quiz-option-emoji" aria-hidden="true">
                    {opt.emoji}
                  </span>
                  <span className="quiz-option-body">
                    <strong className="quiz-option-label">{opt.label}</strong>
                    {opt.desc ? <span className="quiz-option-desc">{opt.desc}</span> : null}
                  </span>
                  <span className="quiz-option-check" aria-hidden="true">
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {question.multi && question.id === "helpAreas" ? (
            <p className="quiz-hint">Tap up to 3 areas you want the most help with</p>
          ) : null}
        </div>

        <footer className="quiz-footer">
          {step > 0 || history.length ? (
            <button
              type="button"
              className="btn btn-secondary quiz-back"
              onClick={() => (step > 0 ? setStep((s) => Math.max(0, s - 1)) : setScreen("gate"))}
            >
              {step > 0 ? "Back" : "Past quizzes"}
            </button>
          ) : (
            <span className="quiz-footer-spacer" />
          )}
          {question.multi ? (
            <button type="button" className="btn btn-primary quiz-next" disabled={!canContinue} onClick={next}>
              {step === STYLE_QUIZ_QUESTIONS.length - 1 ? "See my style plan" : "Continue"}
            </button>
          ) : (
            <p className="quiz-tap-hint">Tap an option to continue</p>
          )}
        </footer>
      </div>
    </div>
  );
}

function QuizGate({
  seasonLabel,
  history,
  templates,
  onNew,
  onCustom,
  onOpen,
  onDelete,
}: {
  seasonLabel: string;
  history: StyleQuizPayload[];
  templates: QuizTemplate[];
  onNew: () => void;
  onCustom: (template: QuizTemplate) => void;
  onOpen: (payload: StyleQuizPayload) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="quiz-shell quiz-shell-wide">
      <div className="quiz-home anim-fade-up">
        <header className="quiz-home-hero">
          <p className="quiz-season-badge">{seasonLabel}</p>
          <div className="quiz-home-heading">
            <div>
              <h1>Your style plans</h1>
              <p>
                Saved plans stay here. Take the seasonal quiz again anytime — new answers add a new plan instead of
                replacing the last one.
              </p>
            </div>
            <button className="btn btn-primary" type="button" onClick={onNew}>
              Take seasonal quiz
            </button>
          </div>
        </header>

        {templates.length ? (
          <section className="quiz-home-section">
            <h2>More quizzes</h2>
            <div className="quiz-offer-grid">
              {templates.map((template) => (
                <button key={template.id} type="button" className="quiz-offer" onClick={() => onCustom(template)}>
                  <span className="quiz-offer-kicker">Staff quiz</span>
                  <strong>{template.title}</strong>
                  <span>{template.description || `${template.questions.length} questions`}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="quiz-home-section">
          <h2>Completed plans</h2>
          {history.length ? (
            <ul className="quiz-plan-grid">
              {history.map((row) => (
                <li key={row.id || row.completedAt} className="quiz-plan-card">
                  <div className="quiz-plan-accent" aria-hidden="true" />
                  <div className="quiz-plan-copy">
                    <span className="quiz-plan-kicker">{row.quizTitle || "Seasonal style quiz"}</span>
                    <strong>{row.result.headline}</strong>
                    <p>
                      {new Date(row.completedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="quiz-history-summary">{row.result.stylePersonality}</p>
                  </div>
                  <div className="quiz-plan-actions">
                    <button className="btn btn-primary" type="button" onClick={() => onOpen(row)}>
                      View plan
                    </button>
                    {row.id ? (
                      <button className="btn btn-secondary" type="button" onClick={() => onDelete(row.id!)}>
                        Delete
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No completed plans yet. Take the seasonal quiz to create your first one.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function CustomQuizRunner({
  template,
  step,
  answers,
  onBack,
  onAnswers,
  onStep,
  onFinish,
}: {
  template: QuizTemplate;
  step: number;
  answers: Record<string, string | string[]>;
  onBack: () => void;
  onAnswers: (value: Record<string, string | string[]>) => void;
  onStep: (value: number) => void;
  onFinish: () => void;
}) {
  const question = template.questions[step];
  if (!question) return null;
  const selected = answers[question.id];
  const canContinue = question.multi ? Array.isArray(selected) && selected.length > 0 : Boolean(selected);
  const progress = ((step + 1) / template.questions.length) * 100;

  function pick(value: string) {
    if (question.multi) {
      const list = Array.isArray(selected) ? selected : [];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      onAnswers({ ...answers, [question.id]: next });
      return;
    }
    onAnswers({ ...answers, [question.id]: value });
    if (step < template.questions.length - 1) {
      window.setTimeout(() => onStep(step + 1), 180);
      return;
    }
    window.setTimeout(() => onFinish(), 180);
  }

  return (
    <div className="quiz-shell">
      <div className="quiz-card anim-fade-up">
        <header className="quiz-header">
          <div className="quiz-header-top">
            <span className="quiz-season-badge">{template.title}</span>
            <span className="quiz-step-label">
              {step + 1} / {template.questions.length}
            </span>
          </div>
          <div className="quiz-progress" aria-hidden="true">
            <span className="quiz-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </header>
        <div className="quiz-body">
          <h1 className="quiz-question-title">{question.title}</h1>
          <p className="quiz-question-sub">{question.subtitle}</p>
          <div className={`quiz-options ${question.multi ? "quiz-options-multi" : ""}`}>
            {question.options.map((opt) => {
              const on = question.multi
                ? Array.isArray(selected) && selected.includes(opt.value)
                : selected === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`quiz-option ${on ? "quiz-option-selected" : ""}`}
                  onClick={() => pick(opt.value)}
                >
                  <span className="quiz-option-emoji">{opt.emoji || "•"}</span>
                  <span className="quiz-option-body">
                    <strong className="quiz-option-label">{opt.label}</strong>
                    {opt.desc ? <span className="quiz-option-desc">{opt.desc}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <footer className="quiz-footer">
          <button type="button" className="btn btn-secondary quiz-back" onClick={onBack}>
            Back
          </button>
          {question.multi ? (
            <button
              type="button"
              className="btn btn-primary quiz-next"
              disabled={!canContinue}
              onClick={() => {
                if (step < template.questions.length - 1) onStep(step + 1);
                else onFinish();
              }}
            >
              {step === template.questions.length - 1 ? "See results" : "Continue"}
            </button>
          ) : (
            <p className="quiz-tap-hint">Tap an option to continue</p>
          )}
        </footer>
      </div>
    </div>
  );
}

function QuizResults({
  payload,
  onRetake,
  onHistory,
}: {
  payload: StyleQuizPayload;
  onRetake: () => void;
  onHistory: () => void;
}) {
  const result = payload.result;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [payload.id]);

  return (
    <div className="quiz-shell">
      <div className="quiz-results quiz-card anim-fade-up">
        <header className="quiz-results-hero">
          <p className="section-kicker">{payload.quizTitle || payload.seasonLabel} · Your style plan</p>
          <h1>{result.headline}</h1>
          <p className="section-lead">{result.summary}</p>
          <p className="quiz-personality">{result.stylePersonality}</p>
          <p className="muted">Saved {new Date(payload.completedAt).toLocaleString()}</p>
        </header>

        {result.suitPicks.length ? (
          <section className="quiz-result-block">
            <h2>Suit &amp; formal picks</h2>
            <div className="quiz-card-grid">
              {result.suitPicks.map((s) => (
                <article key={s.title + s.detail} className={`quiz-result-card priority-${s.priority}`}>
                  <span className="quiz-priority">{s.priority}</span>
                  <h3>{s.title}</h3>
                  <p>{s.detail}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {result.outfitIdeas.length ? (
          <section className="quiz-result-block">
            <h2>Outfits for your occasions</h2>
            <div className="quiz-card-grid">
              {result.outfitIdeas.map((o) => (
                <article key={o.occasion + o.detail} className="quiz-result-card">
                  <h3>{o.occasion}</h3>
                  <p>{o.detail}</p>
                  <div className="quiz-color-tags">
                    {o.colors.map((c) => (
                      <span key={c} className="tag">
                        {c}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {result.shoppingList.length ? (
          <section className="quiz-result-block">
            <h2>Shopping priorities</h2>
            <ul className="guide-list quiz-guide-list">
              {result.shoppingList.map((s) => (
                <li key={s.item}>
                  <strong>{s.item}</strong>
                  <span>{s.why}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {result.groomingTips.length > 0 ? (
          <section className="quiz-result-block">
            <h2>Grooming &amp; details</h2>
            <ul className="guide-list quiz-guide-list">
              {result.groomingTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="quiz-result-block">
          <h2>Next steps</h2>
          <ul className="guide-list quiz-guide-list">
            {result.nextSteps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <div className="quiz-results-actions">
          <Link className="btn btn-primary" href="/stylist">
            Ask AI stylist
          </Link>
          <Link className="btn btn-secondary" href="/shop">
            Shop my palette
          </Link>
          <button type="button" className="btn btn-secondary" onClick={onHistory}>
            Past quizzes
          </button>
          <button type="button" className="btn btn-secondary" onClick={onRetake}>
            Take another quiz
          </button>
        </div>
      </div>
    </div>
  );
}
