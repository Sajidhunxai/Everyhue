"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompareResult } from "@photomatcher/types";
import { srgbToLab, stubSamplesFromAverageRgb } from "@photomatcher/color-engine";

async function samplesFromFile(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, 64, 64);
  const data = ctx.getImageData(20, 22, 24, 20).data;
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  bitmap.close();
  const avg = { r: r / n, g: g / n, b: b / n };
  const labs = stubSamplesFromAverageRgb(avg.r, avg.g, avg.b);
  labs.push(srgbToLab(avg.r, avg.g, avg.b));
  return labs;
}

export default function ComparePage() {
  const router = useRouter();
  const [result, setResult] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  async function compare() {
    if (!fileA || !fileB) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const [samplesA, samplesB] = await Promise.all([
        samplesFromFile(fileA),
        samplesFromFile(fileB),
      ]);
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          photoA: { label: "Photo A", samples: samplesA },
          photoB: { label: "Photo B", samples: samplesB },
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compare failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>Compare two photos</h1>
      <p className="lead">Find which photo has better lighting before you analyze.</p>
      <div className="form-grid">
        <label>
          Photo A
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFileA(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Photo B
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFileB(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={busy || !fileA || !fileB}
        onClick={compare}
      >
        {busy ? "Comparing…" : "Compare lighting"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <div className="compare-result">
          <p>
            <strong>Lighting score:</strong> {result.lightingScore}/100
          </p>
          <p>
            <strong>Consistency:</strong> {result.consistencyScore}/100
          </p>
          <p>{result.recommendation}</p>
          <p className="muted">
            {result.photoA.label}: {result.photoA.brightness} —{" "}
            {result.photoA.undertoneHint}
          </p>
          <p className="muted">
            {result.photoB.label}: {result.photoB.brightness} —{" "}
            {result.photoB.undertoneHint}
          </p>
        </div>
      ) : null}
    </section>
  );
}
