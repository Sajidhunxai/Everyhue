"use client";

import type { AnalyzeResult } from "@photomatcher/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StyleQuizFlow } from "@/components/style-quiz-flow";
import { loadLastResult } from "@/lib/last-result";

export default function QuizPage() {
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);

  useEffect(() => {
    const stored = loadLastResult();
    if (stored) setAnalysis(stored);
  }, []);

  if (!analysis) {
    return (
      <section className="panel quiz-empty">
        <h1>Style quiz</h1>
        <p className="lead">
          Complete a color analysis first — the quiz uses your seasonal palette to
          recommend suits, outfits, and shopping priorities.
        </p>
        <div className="actions">
          <Link className="btn btn-primary" href="/analyze">
            Analyze my colors
          </Link>
          <Link className="btn btn-secondary" href="/login">
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="quiz-page">
      <StyleQuizFlow analysis={analysis} />
    </div>
  );
}
