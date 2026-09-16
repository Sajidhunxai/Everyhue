"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildTryOnCatalog } from "@photomatcher/color-engine";
import type { AnalyzeResult } from "@photomatcher/types";
import { TryOnStudio } from "@/components/try-on-studio";
import { loadLastResult } from "@/lib/last-result";

export default function TryOnPage() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setResult(loadLastResult());
    setReady(true);
  }, []);

  const catalog = useMemo(() => (result ? buildTryOnCatalog(result) : null), [result]);

  if (!ready) {
    return (
      <section className="panel">
        <p className="lead">Loading look studio…</p>
      </section>
    );
  }

  if (!result || !catalog) {
    return (
      <section className="panel">
        <h1>Look studio</h1>
        <p className="lead">Run a color analysis first, then try hair, eyes, lips, jewelry, and dress colors on your photo.</p>
        <Link className="btn btn-primary" href="/analyze">
          Analyze a photo
        </Link>
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="muted">{result.seasonLabel}</p>
      <h1>Look studio</h1>
      <p className="lead">
        Recolor the photo saved with this analysis. Change photo only if you want a different portrait.
      </p>
      <TryOnStudio catalog={catalog} seasonLabel={result.seasonLabel} />
    </section>
  );
}
