"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WardrobeItem } from "@photomatcher/types";
import { useToast } from "@/components/toast";
import { Select } from "@/components/select";

const CATEGORIES = [
  "General",
  "Palette",
  "Suits",
  "Shirts",
  "Casual",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Makeup",
] as const;

export default function WardrobePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [hex, setHex] = useState("#E8A87C");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("General");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/wardrobe", { credentials: "include" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setError("Could not load wardrobe");
      return;
    }
    setItems(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter a name for this piece.");
      return;
    }
    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hex, name: name.trim(), category }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setError("Could not add item");
      toast("Could not add item", "error");
      return;
    }
    setName("");
    toast("Added to wardrobe");
    void load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/wardrobe?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast("Item removed");
      void load();
    }
  }

  return (
    <section className="panel">
      <h1>Wardrobe checklist</h1>
      <p className="lead">Save palette colors and pieces you own or want to buy.</p>
      <form className="form-grid" onSubmit={add}>
        <label>
          Color
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} />
        </label>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="Navy blazer"
          />
        </label>
        <label>
          Category
          <Select
            aria-label="Category"
            value={category}
            onChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}
            options={CATEGORIES.map((option) => ({ value: option, label: option }))}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Add item
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <ul className="wardrobe-list">
        {items.map((i) => (
          <li key={i.id}>
            <span className="color-dot" style={{ background: i.hex }} />
            <div>
              <strong>{i.name}</strong>
              <span className="muted"> · {i.category}</span>
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => remove(i.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
