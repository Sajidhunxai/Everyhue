"use client";

import { useEffect, useState } from "react";
import type { TryOnCatalog } from "@photomatcher/types";
import { TryOnStudio } from "@/components/try-on-studio";

type Init = {
  catalog: TryOnCatalog;
  photo: string;
  seasonLabel: string;
};

function readInit(raw: unknown): Init | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as { type?: string; catalog?: TryOnCatalog; photo?: string; seasonLabel?: string };
  if (!data.catalog || !data.photo) return null;
  return {
    catalog: data.catalog,
    photo: data.photo,
    seasonLabel: data.seasonLabel || "Look studio",
  };
}

export default function TryOnEmbedPage() {
  const [init, setInit] = useState<Init | null>(null);

  useEffect(() => {
    function apply(raw: unknown) {
      const next = readInit(raw);
      if (next) setInit(next);
    }
    apply((window as Window & { __TRYON_INIT?: unknown }).__TRYON_INIT);
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
      ) : (
        <section className="panel">
          <p className="lead">Opening the same Look studio as the website…</p>
        </section>
      )}
    </div>
  );
}
