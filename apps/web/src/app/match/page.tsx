"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreHexAgainstPalette, labToHex } from "@photomatcher/color-engine";
import type { AnalyzeResult, PaletteMatch } from "@photomatcher/types";
import { samplesFromImageFile } from "@/lib/image-samples";
import { loadLastResult } from "@/lib/last-result";
import { useToast } from "@/components/toast";

function normalizeHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

export default function MatchPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [ready, setReady] = useState(false);
  const [picker, setPicker] = useState("#7B9FD4");
  const [hexInput, setHexInput] = useState("#7B9FD4");
  const [match, setMatch] = useState<PaletteMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setResult(loadLastResult());
    setReady(true);
  }, []);

  function score(hex: string, analysis = result) {
    if (!analysis) return;
    const normalized = normalizeHex(hex);
    if (!normalized) {
      setError("Enter a 6-digit hex color like #7B9FD4.");
      return;
    }
    setError(null);
    const scored = scoreHexAgainstPalette(normalized, analysis.palette, analysis.avoid);
    setMatch(scored);
    setPicker(normalized);
    setHexInput(normalized);
    if (scored) toast(`${scored.score}% ${scored.verdict} match`);
  }

  async function fromPhoto(file: File | null) {
    if (!file || !result) return;
    setBusy(true);
    try {
      const samples = await samplesFromImageFile(file);
      const hex = labToHex(samples[0]);
      score(hex);
    } catch {
      setError("Could not read that photo.");
      toast("Could not read that photo", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <section className="panel">
        <p className="lead">Loading palette…</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel">
        <h1>Palette match</h1>
        <p className="lead">Run a color analysis first, then score any garment color against your season.</p>
        <Link className="btn btn-primary" href="/analyze">
          Analyze a photo
        </Link>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>Palette match</h1>
      <p className="lead">
        Check a store color against {result.seasonLabel}. Excellent is 85%+, avoid colors sit too close to your “usually skip” list.
      </p>

      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          score(hexInput);
        }}
      >
        <label>
          Color picker
          <input
            type="color"
            value={picker}
            onChange={(e) => {
              setPicker(e.target.value);
              setHexInput(e.target.value.toUpperCase());
            }}
          />
        </label>
        <label>
          Hex code
          <input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="#7B9FD4"
            spellCheck={false}
          />
        </label>
        <label>
          Sample from a photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => void fromPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Reading…" : "Score color"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {match ? (
        <div className="compare-result">
          <div className="swatch-row">
            <div className="swatch">
              <span style={{ background: match.hex }} />
              Your color
            </div>
            <div className="swatch">
              <span style={{ background: match.closest.hex }} />
              Closest: {match.closest.name}
            </div>
          </div>
          <p>
            <strong>
              {match.score}% {match.verdict}
            </strong>{" "}
            · distance {match.deltaE}
          </p>
          {match.verdict === "avoid" && match.nearestAvoid ? (
            <p className="muted">This sits closer to {match.nearestAvoid.name}, which usually fights your season.</p>
          ) : (
            <p className="muted">Nearest palette color is {match.closest.name}.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
