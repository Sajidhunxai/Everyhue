"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyzeResult } from "@photomatcher/types";
import { ResultsDisplay } from "@/components/results-display";

export default function ResultsPage() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const raw = sessionStorage.getItem("photomatcher:lastResult");
      if (raw) {
        try {
          setResult(JSON.parse(raw) as AnalyzeResult);
          setLoading(false);
          return;
        } catch {
          /* fall through */
        }
      }
      try {
        const res = await fetch("/api/analyses", { credentials: "include" });
        if (res.ok) {
          const rows = (await res.json()) as { result: AnalyzeResult }[];
          if (rows[0]?.result) {
            setResult(rows[0].result);
            sessionStorage.setItem(
              "photomatcher:lastResult",
              JSON.stringify(rows[0].result),
            );
          }
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function saveToWardrobe(hex: string, name: string) {
    setSaveMsg(null);
    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hex, name, category: "Palette" }),
    });
    if (!res.ok) {
      setSaveMsg(res.status === 401 ? "Sign in to save colors." : "Could not save.");
      return;
    }
    setSaveMsg(`Saved ${name} to wardrobe`);
  }

  if (loading) {
    return (
      <section className="panel">
        <p className="lead">Loading results…</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel">
        <h1>No results yet</h1>
        <Link className="btn btn-primary" href="/analyze">
          Go to analyze
        </Link>
      </section>
    );
  }

  return (
    <section className="panel results-panel">
      <p className="muted">Engine {result.engine_version}</p>
      <h1>{result.seasonLabel}</h1>
      <ResultsDisplay result={result} />
      {saveMsg ? <p className="lead">{saveMsg}</p> : null}
      <div className="actions" style={{ marginTop: "1.5rem" }}>
        <Link className="btn btn-primary" href="/shop">
          Shop my palette
        </Link>
        <Link className="btn btn-primary" href="/quiz">
          Take style quiz
        </Link>
        <Link className="btn btn-secondary" href="/stylist">
          Ask stylist
        </Link>
        <Link className="btn btn-secondary" href="/results/print">
          Print / Save PDF
        </Link>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() =>
            result.palette[0] &&
            saveToWardrobe(result.palette[0].hex, result.palette[0].name)
          }
        >
          Save top color
        </button>
        <Link className="btn btn-secondary" href="/analyze">
          Analyze again
        </Link>
      </div>
    </section>
  );
}
