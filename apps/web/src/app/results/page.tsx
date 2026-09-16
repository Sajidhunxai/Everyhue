"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyzeResult } from "@photomatcher/types";
import { ResultsDisplay } from "@/components/results-display";
import { loadLastResult, saveLastResult } from "@/lib/last-result";
import { useToast } from "@/components/toast";

export default function ResultsPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const id = new URLSearchParams(window.location.search).get("id");
      if (id) {
        const res = await fetch(`/api/analyses?id=${encodeURIComponent(id)}`, { credentials: "include" });
        if (res.ok) {
          const row = (await res.json()) as { result: AnalyzeResult };
          if (row.result) {
            saveLastResult(row.result);
            setResult(row.result);
            setLoading(false);
            return;
          }
        }
      }
      const stored = loadLastResult();
      if (stored) {
        setResult(stored);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/analyses", { credentials: "include" });
        if (res.ok) {
          const rows = (await res.json()) as { result: AnalyzeResult }[];
          if (rows[0]?.result) {
            setResult(rows[0].result);
            saveLastResult(rows[0].result);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function saveToWardrobe(hex: string, name: string) {
    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hex, name, category: "Palette" }),
    });
    if (!res.ok) {
      toast(res.status === 401 ? "Sign in to save colors." : "Could not save.", "error");
      return;
    }
    toast(`Saved ${name} to wardrobe`);
  }

  async function shareCard() {
    if (!result) return;
    const text = `My Every Hue season is ${result.seasonLabel} (${result.undertone} undertone). Palette: ${result.palette.map((s) => s.name).join(", ")}.`;
    const url = `${window.location.origin}/results`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Every Hue style card", text, url });
        toast("Shared style card");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("Style card copied");
    } catch {
      toast("Share canceled", "info");
    }
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
        <p className="lead">Run a new analysis, or open one from your history if you have saved results.</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/analyze">
            Go to analyze
          </Link>
          <Link className="btn btn-secondary" href="/history">
            View history
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel results-panel">
      <p className="muted">Engine {result.engine_version}</p>
      <h1>{result.seasonLabel}</h1>
      <ResultsDisplay result={result} />
      <div className="actions" style={{ marginTop: "1.5rem" }}>
        <Link className="btn btn-primary" href="/shop">
          Shop my palette
        </Link>
        <Link className="btn btn-primary" href="/beauty">
          Makeup &amp; hair
        </Link>
        <Link className="btn btn-primary" href="/try-on">
          Try hair &amp; eyes
        </Link>
        <Link className="btn btn-secondary" href="/match">
          Match a color
        </Link>
        <Link className="btn btn-secondary" href="/looks">
          Save a look
        </Link>
        <Link className="btn btn-secondary" href="/quiz">
          Take style quiz
        </Link>
        <Link className="btn btn-secondary" href="/stylist">
          Ask stylist
        </Link>
        <Link className="btn btn-secondary" href="/results/print">
          Print / Save PDF
        </Link>
        <button className="btn btn-secondary" type="button" onClick={() => void shareCard()}>
          Share style card
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() =>
            result.palette[0] &&
            void saveToWardrobe(result.palette[0].hex, result.palette[0].name)
          }
        >
          Save top color
        </button>
        <Link className="btn btn-secondary" href="/analyze">
          Analyze again
        </Link>
        <Link className="btn btn-secondary" href="/history">
          History
        </Link>
      </div>
    </section>
  );
}
