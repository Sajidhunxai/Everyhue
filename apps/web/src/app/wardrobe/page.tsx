"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WardrobeItem } from "@photomatcher/types";

export default function WardrobePage() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [hex, setHex] = useState("#E8A87C");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
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
    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hex, name, category }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setError("Could not add item");
      return;
    }
    setName("");
    void load();
  }

  async function remove(id: string) {
    await fetch(`/api/wardrobe?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    void load();
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
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
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
