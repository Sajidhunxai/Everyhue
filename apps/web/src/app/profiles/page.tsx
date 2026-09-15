"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FamilyProfile } from "@photomatcher/types";

type ProfileRow = FamilyProfile & {
  lastAnalysis?: { id: string; result: FamilyProfile["lastAnalysis"]; createdAt: string } | null;
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Partner");

  async function load() {
    const res = await fetch("/api/profiles");
    if (res.ok) setProfiles(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, relation }),
    });
    setName("");
    void load();
  }

  async function remove(id: string) {
    await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <section className="panel">
      <h1>Family profiles</h1>
      <p className="lead">Save analyses for partner, kids, or friends under your account.</p>
      <form className="form-grid" onSubmit={add}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Relation
          <input value={relation} onChange={(e) => setRelation(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">
          Add profile
        </button>
      </form>
      <ul className="wardrobe-list">
        {profiles.map((p) => (
          <li key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <span className="muted"> · {p.relation}</span>
              {p.lastAnalysis?.result ? (
                <p className="muted">Last season: {(p.lastAnalysis.result as { seasonLabel?: string }).seasonLabel}</p>
              ) : (
                <p className="muted">No analysis yet</p>
              )}
            </div>
            <Link className="btn btn-secondary" href={`/analyze?profile=${p.id}`}>
              Analyze
            </Link>
            <button className="btn btn-secondary" type="button" onClick={() => remove(p.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
