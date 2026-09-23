"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildTryOnCatalog } from "@photomatcher/color-engine";
import type { TryOnCatalog } from "@photomatcher/types";
import { TryOnStudio } from "@/components/try-on-studio";
import { loadLastPhoto, loadLastResult } from "@/lib/last-result";

type Init = {
  catalog: TryOnCatalog;
  photo?: string | null;
  seasonLabel: string;
};

function readInit(raw: unknown): Init | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as { catalog?: TryOnCatalog; photo?: string; seasonLabel?: string };
  if (!data.catalog) return null;
  return {
    catalog: data.catalog,
    photo: data.photo || null,
    seasonLabel: data.seasonLabel || "Look studio",
  };
}

function fromSavedAnalysis(): Init | null {
  const result = loadLastResult();
  if (!result) return null;
  return {
    catalog: buildTryOnCatalog(result),
    photo: loadLastPhoto(),
    seasonLabel: result.seasonLabel,
  };
}

export default function TryOnEmbedPage() {
  const [init, setInit] = useState<Init | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function apply(raw: unknown) {
      const next = readInit(raw);
      if (next) setInit(next);
    }
    apply((window as Window & { __TRYON_INIT?: unknown }).__TRYON_INIT);
    setInit((current) => current ?? fromSavedAnalysis());
    setReady(true);
    function onCustom(event: Event) {
      apply((event as CustomEvent).detail);
    }
    function onMessage(event: MessageEvent) {
      apply(event.data);
    }
    window.addEventListener("tryon-init", onCustom);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("tryon-init", onCustom);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <div className="tryon-embed-root">
      {init ? (
        <TryOnStudio catalog={init.catalog} seasonLabel={init.seasonLabel} initialPhoto={init.photo} />
      ) : ready ? (
        <section className="panel">
          <h1>Look studio</h1>
          <p className="lead">Analyze a photo first, then this page can recolor hair, eyes, and lips.</p>
          <Link className="btn btn-primary" href="/analyze">
            Analyze a photo
          </Link>
        </section>
      ) : (
        <section className="panel">
          <p className="lead">Loading Look studio…</p>
        </section>
      )}
    </div>
  );
}
