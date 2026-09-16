"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { AnalyzeResult, BodyType, FaceShape } from "@photomatcher/types";
import { samplesFromImageFile } from "@/lib/image-samples";
import { saveLastResult } from "@/lib/last-result";
import { useToast } from "@/components/toast";

type FamilyProfileOption = { id: string; name: string; relation: string };

function AnalyzeForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceShape, setFaceShape] = useState<FaceShape>("oval");
  const [bodyType, setBodyType] = useState<BodyType>("balanced");
  const [profileId, setProfileId] = useState("");
  const [profiles, setProfiles] = useState<FamilyProfileOption[]>([]);

  useEffect(() => {
    const fromQuery = searchParams.get("profile");
    if (fromQuery) setProfileId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProfiles)
      .catch(() => null);
  }, []);

  async function onFile(file: File | null) {
    if (!file) {
      setError("Please choose a photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const samples = await samplesFromImageFile(file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "lab",
          samples,
          faceShape,
          bodyType,
          profileId: profileId || undefined,
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        let message = "Analysis failed";
        try {
          const body = (await res.json()) as { error?: string | { formErrors?: string[] } };
          if (typeof body.error === "string") message = body.error;
        } catch {
          message = await res.text();
        }
        throw new Error(message);
      }
      const data = (await res.json()) as AnalyzeResult;
      saveLastResult(data);
      toast("Analysis ready");
      router.push("/results");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>Analyze a photo</h1>
      <p className="lead">
        Use daylight and a clear <strong>human face photo</strong> with shoulders visible.
        We check that the image looks like a person before analyzing skin tones.
        Optional face and body inputs unlock neckline, silhouette, and eyewear tips.
      </p>

      <div className="form-grid">
        <label>
          Face shape
          <select value={faceShape} onChange={(e) => setFaceShape(e.target.value as FaceShape)}>
            <option value="oval">Oval</option>
            <option value="round">Round</option>
            <option value="square">Square</option>
            <option value="heart">Heart</option>
            <option value="oblong">Oblong</option>
            <option value="diamond">Diamond</option>
          </select>
        </label>
        <label>
          Body type
          <select value={bodyType} onChange={(e) => setBodyType(e.target.value as BodyType)}>
            <option value="balanced">Balanced</option>
            <option value="pear">Pear</option>
            <option value="apple">Apple</option>
            <option value="hourglass">Hourglass</option>
            <option value="rectangle">Rectangle</option>
            <option value="inverted_triangle">Inverted triangle</option>
          </select>
        </label>
        <label>
          Family profile (optional)
          <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
            <option value="">Myself</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.relation})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="btn btn-primary" style={{ marginTop: "1rem" }}>
        {busy ? "Analyzing…" : "Choose photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<section className="panel"><p>Loading…</p></section>}>
      <AnalyzeForm />
    </Suspense>
  );
}
