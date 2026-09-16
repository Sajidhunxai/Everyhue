"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FamilyProfile, SavedAnalysis } from "@photomatcher/types";
import { useToast } from "@/components/toast";
import { saveLastResult } from "@/lib/last-result";
import { Select } from "@/components/select";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "analysis";
}

function downloadJson(row: SavedAnalysis) {
  const payload = {
    id: row.id,
    title: row.title,
    notes: row.notes,
    createdAt: row.createdAt,
    faceShape: row.faceShape,
    bodyType: row.bodyType,
    ...row.result,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `every-hue-${slug(row.title || row.result.seasonLabel)}-${row.createdAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPalette(row: SavedAnalysis) {
  const lines = ["name,hex,kind"];
  for (const s of row.result.palette) lines.push(`"${s.name}",${s.hex},palette`);
  for (const s of row.result.avoid) lines.push(`"${s.name}",${s.hex},avoid`);
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `every-hue-palette-${slug(row.result.seasonLabel)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<SavedAnalysis[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [profileId, setProfileId] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  async function load() {
    const [analysisRes, profileRes] = await Promise.all([
      fetch("/api/analyses", { credentials: "include" }),
      fetch("/api/profiles", { credentials: "include" }),
    ]);
    if (analysisRes.status === 401) {
      router.push("/login");
      return;
    }
    if (analysisRes.ok) setRows(await analysisRes.json());
    if (profileRes.ok) setProfiles(await profileRes.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [
        row.title,
        row.notes,
        row.result.seasonLabel,
        row.result.undertone,
        row.result.seasonId,
        profiles.find((p) => p.id === row.profileId)?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, profiles]);

  function openRow(row: SavedAnalysis) {
    saveLastResult(row.result);
    router.push("/results");
  }

  function startEdit(row: SavedAnalysis) {
    setEditing(row.id);
    setTitle(row.title ?? row.result.seasonLabel);
    setNotes(row.notes ?? "");
    setProfileId(row.profileId ?? "");
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const res = await fetch("/api/analyses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        title,
        notes,
        profileId: profileId || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast("Could not save changes", "error");
      return;
    }
    const updated = (await res.json()) as SavedAnalysis;
    setRows((current) => current.map((row) => (row.id === id ? updated : row)));
    setEditing(null);
    toast("Analysis updated");
  }

  async function remove(ids: string[]) {
    if (!ids.length) return;
    const ok = window.confirm(
      ids.length === 1 ? "Delete this analysis? This cannot be undone." : `Delete ${ids.length} analyses? This cannot be undone.`,
    );
    if (!ok) return;
    const res = await fetch(`/api/analyses?ids=${ids.join(",")}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast("Could not delete", "error");
      return;
    }
    setRows((current) => current.filter((row) => !ids.includes(row.id)));
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    toast(ids.length === 1 ? "Analysis deleted" : "Analyses deleted");
  }

  function toggleSelect(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
  }

  if (loading) {
    return (
      <section className="panel">
        <p className="lead">Loading your analysis history…</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>Analysis history</h1>
      <p className="lead">
        Every signed-in analysis is saved here. Open one to use it across Look studio, makeup, shop, and stylist. Rename,
        assign a family profile, download, or delete anytime.
      </p>

      <div className="history-toolbar">
        <label className="history-search">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Season, name, notes…"
          />
        </label>
        <div className="actions">
          <Link className="btn btn-primary" href="/analyze">
            New analysis
          </Link>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={!selected.length}
            onClick={() => void remove(selected)}
          >
            Delete selected
          </button>
        </div>
      </div>

      {!rows.length ? (
        <p className="muted">No saved analyses yet. Run a color analysis while signed in to start your history.</p>
      ) : !filtered.length ? (
        <p className="muted">No analyses match that search.</p>
      ) : (
        <ul className="history-list">
          {filtered.map((row) => {
            const profile = profiles.find((p) => p.id === row.profileId);
            const heading = row.title || row.result.seasonLabel;
            const on = selected.includes(row.id);
            return (
              <li key={row.id} className="history-card">
                <label className="history-check">
                  <input type="checkbox" checked={on} onChange={() => toggleSelect(row.id)} aria-label={`Select ${heading}`} />
                </label>
                <div className="history-card-body">
                  <div className="history-card-top">
                    <div>
                      <strong>{heading}</strong>
                      <p className="muted history-meta">
                        {row.result.seasonLabel} · {row.result.undertone} undertone ·{" "}
                        {Math.round(row.result.confidence * 100)}% confidence
                        {profile ? ` · ${profile.name}` : ""}
                        {" · "}
                        {formatWhen(row.createdAt)}
                      </p>
                    </div>
                    <div className="swatch-row">
                      {row.result.palette.slice(0, 6).map((swatch) => (
                        <span
                          key={`${row.id}-${swatch.hex}`}
                          className="color-dot"
                          style={{ background: swatch.hex }}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>
                  {row.notes ? <p className="history-notes">{row.notes}</p> : null}

                  {editing === row.id ? (
                    <div className="history-edit">
                      <label>
                        Name
                        <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
                      </label>
                      <label>
                        Notes
                        <textarea value={notes} maxLength={500} rows={3} onChange={(e) => setNotes(e.target.value)} />
                      </label>
                      <label>
                        Family profile
                        <Select
                          aria-label="Family profile"
                          value={profileId}
                          onChange={setProfileId}
                          options={[
                            { value: "", label: "Not assigned" },
                            ...profiles.map((p) => ({ value: p.id, label: `${p.name} (${p.relation})` })),
                          ]}
                        />
                      </label>
                      <div className="actions">
                        <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void saveEdit(row.id)}>
                          {busy ? "Saving…" : "Save"}
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="actions">
                      <button className="btn btn-primary" type="button" onClick={() => openRow(row)}>
                        Open
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => startEdit(row)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          downloadJson(row);
                          toast("Downloaded JSON");
                        }}
                      >
                        Download JSON
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          downloadPalette(row);
                          toast("Downloaded palette CSV");
                        }}
                      >
                        Download palette
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          saveLastResult(row.result);
                          router.push("/results/print");
                        }}
                      >
                        Print / PDF
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => void remove([row.id])}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
