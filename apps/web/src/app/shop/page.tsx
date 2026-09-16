"use client";

import { useEffect, useState } from "react";
import type { AnalyzeResult, ShopItem } from "@photomatcher/types";
import { loadLastResult } from "@/lib/last-result";

export default function ShopPage() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const parsed = loadLastResult();
    if (!parsed) return;
    setResult(parsed);
    const params = new URLSearchParams({ seasonId: parsed.seasonId });
    if (category) params.set("category", category);
    fetch(`/api/shop?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setCategories(d.categories);
      });
  }, [category]);

  if (!result) {
    return (
      <section className="panel">
        <h1>Shop my palette</h1>
        <p className="lead">Run an analysis first to see personalized picks.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>Shop my palette</h1>
      <p className="lead">
        Curated ideas for {result.seasonLabel}. Use search terms to find similar items online.
      </p>
      <label className="form-grid" style={{ maxWidth: "16rem" }}>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <div className="shop-grid">
        {items.map((item) => (
          <article className="shop-card" key={item.id}>
            <span className="color-dot large" style={{ background: item.hex }} />
            <strong>{item.name}</strong>
            <span className="muted">{item.category}</span>
            <p>{item.searchTerms.join(" · ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
