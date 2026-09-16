"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyzeResult } from "@photomatcher/types";
import { ResultsDisplay } from "@/components/results-display";
import { loadLastResult } from "@/lib/last-result";

export default function BeautyPage() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setResult(loadLastResult());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section className="panel">
        <p className="lead">Loading beauty guide…</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel">
        <h1>Makeup &amp; hair</h1>
        <p className="lead">Complete a color analysis first to unlock lip, cheek, eye, jewelry, and hair hints.</p>
        <Link className="btn btn-primary" href="/analyze">
          Analyze a photo
        </Link>
      </section>
    );
  }

  const guide = result.styleGuide;

  return (
    <section className="panel results-panel">
      <p className="muted">{result.seasonLabel}</p>
      <h1>Makeup &amp; hair</h1>
      <p className="lead">
        Beauty and metal notes for a {result.undertone} undertone with {guide.contrastLevel} contrast.
      </p>
      <ResultsDisplay result={result} beautyOnly />
      <div className="actions" style={{ marginTop: "1.5rem" }}>
        <Link className="btn btn-primary" href="/shop">
          Shop palette
        </Link>
        <Link className="btn btn-secondary" href="/stylist">
          Ask stylist
        </Link>
      </div>
    </section>
  );
}
