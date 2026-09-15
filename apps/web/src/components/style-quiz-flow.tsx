"use client";

import {
  STYLE_QUIZ_QUESTIONS,
  buildStyleQuizResult,
  emptyStyleQuizAnswers,
  isStyleQuizComplete,
} from "@photomatcher/color-engine";
import type { AnalyzeResult, StyleQuizAnswers, StyleQuizPayload, StyleQuizResult } from "@photomatcher/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "photomatcher:styleQuiz";

type Props = {
  analysis: AnalyzeResult;
};

export function StyleQuizFlow({ analysis }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<StyleQuizAnswers>(emptyStyleQuizAnswers());
  const [done, setDone] = useState<StyleQuizResult | null>(null);

  const question = STYLE_QUIZ_QUESTIONS[step];
  const progress = done ? 100 : ((step + 1) / STYLE_QUIZ_QUESTIONS.length) * 100;

  const toggleMulti = useCallback(
    (field: "occasions" | "helpAreas", value: string, max = 3) => {
      setAnswers((prev) => {
        const list = prev[field];
        if (list.includes(value)) {
          return { ...prev, [field]: list.filter((v) => v !== value) };
        }
        if (list.length >= max) return prev;
        return { ...prev, [field]: [...list, value] };
      });
    },
    [],
  );

  const canContinue = useMemo(() => {
    if (!question) return false;
    if (question.multi) {
      const list = answers[question.id] as string[];
      return list.length > 0;
    }
    return Boolean(answers[question.id]);
  }, [answers, question]);

  function finishQuiz(finalAnswers: StyleQuizAnswers) {
    if (!isStyleQuizComplete(finalAnswers)) return;
    const result = buildStyleQuizResult(analysis, finalAnswers);
    const payload: StyleQuizPayload = {
      answers: finalAnswers,
      result,
      seasonLabel: analysis.seasonLabel,
      completedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setDone(result);
  }

  function next() {
    if (step < STYLE_QUIZ_QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    finishQuiz(answers);
  }

  function back() {
    if (done) {
      setDone(null);
      setStep(STYLE_QUIZ_QUESTIONS.length - 1);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  function handleOptionClick(value: string) {
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
      window.setTimeout(() => setStep((s) => s + 1), 220);
      return;
    }

    window.setTimeout(() => finishQuiz(nextAnswers), 220);
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
              {question.id === "helpAreas"
                ? `${selectedCount} of 3 selected`
                : `${selectedCount} selected`}
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
          {step > 0 ? (
            <button type="button" className="btn btn-secondary quiz-back" onClick={back}>
              Back
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

function QuizResults({
  result,
  seasonLabel,
  onRetake,
}: {
  result: StyleQuizResult;
  seasonLabel: string;
  onRetake: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="quiz-shell">
      <div className="quiz-results quiz-card anim-fade-up">
        <header className="quiz-results-hero">
          <p className="section-kicker">{seasonLabel} · Your style plan</p>
          <h1>{result.headline}</h1>
          <p className="section-lead">{result.summary}</p>
          <p className="quiz-personality">{result.stylePersonality}</p>
        </header>

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
          <button type="button" className="btn btn-secondary" onClick={onRetake}>
            Retake quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export function loadStoredStyleQuiz(): StyleQuizPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StyleQuizPayload;
  } catch {
    return null;
  }
}
