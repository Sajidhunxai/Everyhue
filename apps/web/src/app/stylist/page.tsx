"use client";

import { useEffect, useState } from "react";
import type { AnalyzeResult, StylistMessage } from "@photomatcher/types";
import { useToast } from "@/components/toast";
import { loadLastResult } from "@/lib/last-result";

export default function StylistPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [messages, setMessages] = useState<StylistMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatMode, setChatMode] = useState<"ai" | "rules" | null>(null);

  useEffect(() => {
    setResult(loadLastResult());
    fetch("/api/stylist")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages);
  }, []);

  async function clearChat() {
    const res = await fetch("/api/stylist", { method: "DELETE" });
    if (res.ok) {
      setMessages([]);
      toast("Chat cleared");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!result || !input.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: {
            seasonLabel: result.seasonLabel,
            undertone: result.undertone,
            palette: result.palette,
            neutrals: result.styleGuide?.neutrals ?? [],
          },
        }),
      });
      if (res.ok) {
        const { reply, mode } = (await res.json()) as { reply: string; mode?: "ai" | "rules" };
        if (mode) setChatMode(mode);
        setMessages((m) => [
          ...m,
          { role: "user", content: input, createdAt: new Date().toISOString() },
          { role: "assistant", content: reply, createdAt: new Date().toISOString() },
        ]);
        setInput("");
        toast("Reply received");
      } else {
        toast("Could not send message", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!result) {
    return (
      <section className="panel">
        <h1>Stylist chat</h1>
        <p className="lead">Complete a color analysis first so the stylist knows your palette.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>Stylist chat</h1>
      <p className="lead">Ask about suits, casual wear, makeup, or jewelry for {result.seasonLabel}.</p>
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: "-0.5rem" }}>
        {chatMode === "ai"
          ? "Answers use your palette and chat history."
          : "Try questions about jewelry, suits, casual wear, or what to wear for an occasion."}
      </p>
      <div className="chat-box">
        {messages.map((m, i) => (
          <div className={`chat-bubble ${m.role}`} key={`${m.createdAt}-${i}`}>
            {m.content}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should I wear? Jewelry? Suits for work?"
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Send
        </button>
      </form>
      {messages.length > 0 ? (
        <button className="btn btn-secondary" type="button" onClick={clearChat} style={{ marginTop: "0.75rem" }}>
          Clear chat history
        </button>
      ) : null}
    </section>
  );
}
