"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { AnalyzeResult, BodyType, FaceShape } from "@photomatcher/types";
import { samplesFromImageFile } from "@/lib/image-samples";
import { saveLastResult } from "@/lib/last-result";
import { Select } from "@/components/select";
import { useToast } from "@/components/toast";

const FACE_OPTIONS = [
  { value: "oval", label: "Oval" },
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "heart", label: "Heart" },
  { value: "oblong", label: "Oblong" },
  { value: "diamond", label: "Diamond" },
] as const;

const BODY_OPTIONS = [
  { value: "balanced", label: "Balanced" },
  { value: "pear", label: "Pear" },
  { value: "apple", label: "Apple" },
  { value: "hourglass", label: "Hourglass" },
  { value: "rectangle", label: "Rectangle" },
  { value: "inverted_triangle", label: "Inverted triangle" },
] as const;

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

      <div className="form-grid form-grid-3">
        <label>
          Face shape
          <Select
            aria-label="Face shape"
            value={faceShape}
            onChange={(v) => setFaceShape(v as FaceShape)}
            options={[...FACE_OPTIONS]}
          />
        </label>
        <label>
          Body type
          <Select
            aria-label="Body type"
            value={bodyType}
            onChange={(v) => setBodyType(v as BodyType)}
            options={[...BODY_OPTIONS]}
          />
        </label>
        <label>
          Family profile (optional)
          <Select
            aria-label="Family profile"
            value={profileId}
            onChange={setProfileId}
            options={[
              { value: "", label: "Myself" },
              ...profiles.map((p) => ({ value: p.id, label: `${p.name} (${p.relation})` })),
            ]}
          />
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
