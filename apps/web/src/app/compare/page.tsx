"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CompareResult } from "@photomatcher/types";
import { srgbToLab, stubSamplesFromAverageRgb } from "@photomatcher/color-engine";
import { useToast } from "@/components/toast";

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

const CHECKLIST = [
  "Face a window, not a lamp",
  "No direct sun or harsh shadow",
  "Hair off the forehead",
  "Shoulders visible, no filter",
];

export default function ComparePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [result, setResult] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  async function compare() {
    if (!fileA || !fileB) {
      setError("Choose two photos first.");
      return;
    }
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
      const data = (await res.json()) as CompareResult;
      setResult(data);
      const winner =
        data.betterPhoto === "tie" ? "Both photos are usable" : `Use Photo ${data.betterPhoto}`;
      toast(winner);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compare failed");
      toast("Compare failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>Lighting coach</h1>
      <p className="lead">
        Compare two face photos and we&apos;ll tell you which lighting is safer for analysis — then send you to Analyze.
      </p>

      <h2>Before you shoot</h2>
      <div className="chip-select">
        {CHECKLIST.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip-toggle ${checked[item] ? "chip-toggle-on" : ""}`}
            onClick={() => setChecked((current) => ({ ...current, [item]: !current[item] }))}
          >
            {checked[item] ? "✓ " : ""}
            {item}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <label>
          Photo A
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFileA(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Photo B
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFileB(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={busy || !fileA || !fileB}
        onClick={() => void compare()}
      >
        {busy ? "Comparing…" : "Compare lighting"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <div className="compare-result">
          <p>
            <strong>Photo A:</strong> {result.photoA.score ?? "—"}/100 · {result.photoA.brightness}
          </p>
          <p>
            <strong>Photo B:</strong> {result.photoB.score ?? "—"}/100 · {result.photoB.brightness}
          </p>
          <p>{result.recommendation}</p>
          <p className="muted">
            {result.photoA.label}: {result.photoA.undertoneHint}
          </p>
          <p className="muted">
            {result.photoB.label}: {result.photoB.undertoneHint}
          </p>
          <h3>Retake checklist</h3>
          <ul className="guide-list">
            {(result.lightingTips ?? []).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <Link className="btn btn-primary" href="/analyze">
              Analyze the better photo
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
