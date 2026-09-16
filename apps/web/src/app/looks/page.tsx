"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedLook, WardrobeItem } from "@photomatcher/types";
import { useToast } from "@/components/toast";

const OCCASIONS = [
  "Everyday",
  "Work",
  "Interview",
  "Date",
  "Wedding",
  "Travel",
  "Formal",
  "Casual",
] as const;

export default function LooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number]>("Everyday");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [lookRes, itemRes] = await Promise.all([
      fetch("/api/looks", { credentials: "include" }),
      fetch("/api/wardrobe", { credentials: "include" }),
    ]);
    if (lookRes.status === 401 || itemRes.status === 401) {
      router.push("/login");
      return;
    }
    if (lookRes.ok) setLooks(await lookRes.json());
    if (itemRes.ok) setItems(await itemRes.json());
  }

  useEffect(() => {
    void load();
  }, []);

  const previewHexes = useMemo(
    () => items.filter((item) => selected.includes(item.id)).map((item) => item.hex),
    [items, selected],
  );

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(0, 8),
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !selected.length) {
      setError("Add a look name and pick at least one wardrobe color.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/looks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), occasion, itemIds: selected }),
    });
    setBusy(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save look.");
      toast("Could not save look", "error");
      return;
    }
    setName("");
    setSelected([]);
    toast("Look saved");
    void load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/looks?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toast("Look removed");
      void load();
    }
  }

  return (
    <section className="panel">
      <h1>Saved looks</h1>
      <p className="lead">
        Combine wardrobe colors into named outfits. We score them against your latest seasonal palette.
      </p>

      <form className="form-grid" onSubmit={add}>
        <label>
          Look name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Office navy"
            required
            maxLength={80}
          />
        </label>
        <label>
          Occasion
          <select value={occasion} onChange={(e) => setOccasion(e.target.value as (typeof OCCASIONS)[number])}>
            {OCCASIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save look"}
        </button>
      </form>

      <h2>Wardrobe pieces</h2>
      {items.length ? (
        <div className="chip-select">
          {items.map((item) => {
            const on = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`chip-toggle ${on ? "chip-toggle-on" : ""}`}
                onClick={() => toggle(item.id)}
              >
                <span className="color-dot" style={{ background: item.hex }} />
                {item.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="muted">Save colors in Wardrobe first, then build a look.</p>
      )}

      {previewHexes.length ? (
        <div className="swatch-row">
          {previewHexes.map((hex) => (
            <div className="swatch" key={hex}>
              <span style={{ background: hex }} />
              {hex}
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <ul className="wardrobe-list">
        {looks.map((look) => (
          <li key={look.id}>
            <div>
              <strong>{look.name}</strong>
              <span className="muted">
                {" "}
                · {look.occasion}
                {look.score != null ? ` · ${look.score}% palette match` : ""}
              </span>
              <div className="swatch-row" style={{ marginTop: "0.5rem" }}>
                {look.hexes.map((hex, index) => (
                  <span key={`${look.id}-${hex}-${index}`} className="color-dot" style={{ background: hex }} />
                ))}
              </div>
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => remove(look.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
