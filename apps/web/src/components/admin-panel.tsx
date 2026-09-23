"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomQuizQuestion, QuizTemplate } from "@photomatcher/types";
import { useToast } from "@/components/toast";

type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  isAdmin: boolean;
  analyses: number;
  wardrobe: number;
};

type Stats = { users: number; analyses: number; quizzes: number; templates: number };
type Tab = "overview" | "users" | "quizzes";
type QuizDraft = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  resultTitle: string;
  resultBody: string;
  questions: CustomQuizQuestion[];
};

const emptyQuestion = (): CustomQuizQuestion => ({
  id: `q${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  subtitle: "",
  multi: false,
  options: [
    { value: "a", label: "", emoji: "" },
    { value: "b", label: "", emoji: "" },
  ],
});

const blankQuiz = (): QuizDraft => ({
  id: "",
  title: "",
  description: "",
  published: true,
  resultTitle: "",
  resultBody: "",
  questions: [emptyQuestion()],
});

const starterQuiz = (): QuizDraft => ({
  id: "",
  title: "Weekend wardrobe",
  description: "A short quiz members can take after their seasonal plan.",
  published: true,
  resultTitle: "Your weekend uniform",
  resultBody: "Stay in your seasonal palette, keep contrast low, and repeat two or three easy outfits.",
  questions: [
    {
      id: "q1",
      title: "What is your weekend default?",
      subtitle: "Pick the closest match",
      multi: false,
      options: [
        { value: "tailored", label: "Tailored casual", emoji: "🧥" },
        { value: "relaxed", label: "Relaxed layers", emoji: "👕" },
        { value: "sport", label: "Sporty and easy", emoji: "👟" },
      ],
    },
    {
      id: "q2",
      title: "Where do you get dressed for most?",
      subtitle: "Choose one",
      multi: false,
      options: [
        { value: "brunch", label: "Brunch and errands", emoji: "☕" },
        { value: "dinner", label: "Dinner out", emoji: "🍽️" },
        { value: "travel", label: "Travel days", emoji: "✈️" },
      ],
    },
  ],
});

function makePassword() {
  return `Hue${Math.floor(1000 + Math.random() * 9000)}!`;
}

export function AdminPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("quizzes");
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState(makePassword);
  const [query, setQuery] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<QuizDraft>(blankQuiz);

  async function load() {
    const me = await fetch("/api/admin/me", { credentials: "include" });
    if (me.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const [s, u, t] = await Promise.all([
      fetch("/api/admin/stats", { credentials: "include" }),
      fetch("/api/admin/users", { credentials: "include" }),
      fetch("/api/admin/templates", { credentials: "include" }),
    ]);
    if (s.ok) setStats(await s.json());
    if (u.ok) setUsers(await u.json());
    if (t.ok) setTemplates(await t.json());
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, []);

  const editing = Boolean(quiz.id);
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(q));
  }, [users, query]);

  function resetQuiz() {
    setQuiz(blankQuiz());
    setQuizStep(0);
  }

  function updateQuestion(index: number, next: CustomQuizQuestion) {
    setQuiz((current) => {
      const questions = [...current.questions];
      questions[index] = next;
      return { ...current, questions };
    });
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, name, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      toast(body?.error ?? "Could not create user", "error");
      return;
    }
    toast(`User created. Password: ${password}`);
    setEmail("");
    setName("");
    setPassword(makePassword());
    void load();
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Delete this user and their saved data?")) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      toast("Could not delete user", "error");
      return;
    }
    toast("User deleted");
    void load();
  }

  async function saveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (quizStep < 2) {
      setQuizStep((s) => s + 1);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: quiz.id || undefined,
        title: quiz.title,
        description: quiz.description,
        published: quiz.published,
        resultTitle: quiz.resultTitle || quiz.title,
        resultBody: quiz.resultBody,
        questions: quiz.questions.map((q, i) => ({
          ...q,
          id: q.id || `q${i + 1}`,
          options: q.options.filter((o) => o.label.trim()),
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      toast(body?.error ?? "Could not save quiz", "error");
      return;
    }
    toast(editing ? "Quiz updated" : quiz.published ? "Quiz published on Style quiz" : "Draft saved");
    resetQuiz();
    void load();
  }

  function editTemplate(row: QuizTemplate) {
    setTab("quizzes");
    setQuizStep(0);
    setQuiz({
      id: row.id,
      title: row.title,
      description: row.description,
      published: row.published,
      resultTitle: row.resultTitle,
      resultBody: row.resultBody,
      questions: row.questions.length ? row.questions : [emptyQuestion()],
    });
  }

  async function togglePublished(row: QuizTemplate) {
    const res = await fetch("/api/admin/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: row.id, published: !row.published }),
    });
    if (!res.ok) {
      toast("Could not update quiz", "error");
      return;
    }
    toast(row.published ? "Hidden from Style quiz" : "Now live on Style quiz");
    void load();
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm("Delete this quiz?")) return;
    await fetch(`/api/admin/templates?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    toast("Quiz deleted");
    if (quiz.id === id) resetQuiz();
    void load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <section className="admin-page">
        <p className="muted">Loading admin…</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-hero">
        <div>
          <p className="section-kicker">Every Hue</p>
          <h1>Admin</h1>
          <p className="lead">Create quizzes, add members, and publish them to Style quiz.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <div className="chip-select admin-tabs">
        {(["quizzes", "users", "overview"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip-toggle ${tab === id ? "chip-toggle-on" : ""}`}
            onClick={() => setTab(id)}
          >
            {id === "quizzes" ? "Quizzes" : id === "users" ? "Users" : "Overview"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="admin-metrics">
          <button type="button" className="admin-metric" onClick={() => setTab("users")}>
            <strong>{stats?.users ?? "—"}</strong>
            <span>Users — tap to manage</span>
          </button>
          <button type="button" className="admin-metric" onClick={() => setTab("quizzes")}>
            <strong>{stats?.templates ?? "—"}</strong>
            <span>Quizzes — tap to edit</span>
          </button>
          <article className="admin-metric">
            <strong>{stats?.analyses ?? "—"}</strong>
            <span>Analyses</span>
          </article>
          <article className="admin-metric">
            <strong>{stats?.quizzes ?? "—"}</strong>
            <span>Completed quizzes</span>
          </article>
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="admin-grid">
          <form className="admin-card form-grid" onSubmit={(e) => void createUser(e)}>
            <h2>Add a member</h2>
            <p className="muted">They can sign in on the normal login page with this email and password.</p>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Member" />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@email.com" />
            </label>
            <label>
              Password
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </label>
            <div className="actions">
              <button className="btn btn-secondary" type="button" onClick={() => setPassword(makePassword())}>
                New password
              </button>
              <button className="btn btn-primary" type="submit">
                Add user
              </button>
            </div>
          </form>
          <div className="admin-card">
            <h2>Accounts</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              aria-label="Search users"
            />
            <ul className="admin-list">
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <div>
                    <strong>
                      {user.name || "Unnamed"} {user.isAdmin ? <span className="admin-pill">Admin</span> : null}
                    </strong>
                    <p className="muted">
                      {user.email}
                      <br />
                      {user.analyses} analyses · {user.wardrobe} wardrobe items
                    </p>
                  </div>
                  {!user.isAdmin ? (
                    <button className="btn btn-secondary" type="button" onClick={() => void deleteUser(user.id)}>
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
              {!filteredUsers.length ? <p className="muted">No matching accounts.</p> : null}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "quizzes" ? (
        <div className="admin-grid">
          <form className="admin-card form-grid" onSubmit={(e) => void saveQuiz(e)}>
            <h2>{editing ? "Edit quiz" : "Create a quiz"}</h2>
            <p className="muted">Three short steps. Turn on “Show on Style quiz” when you want members to see it.</p>
            <div className="admin-steps" role="tablist">
              {["Details", "Questions", "Result"].map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`admin-step ${quizStep === i ? "admin-step-on" : ""}`}
                  onClick={() => setQuizStep(i)}
                >
                  {i + 1}. {label}
                </button>
              ))}
            </div>

            {quizStep === 0 ? (
              <>
                <label>
                  Quiz title
                  <input
                    value={quiz.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setQuiz((current) => ({
                        ...current,
                        title,
                        resultTitle: !current.resultTitle || current.resultTitle === current.title ? title : current.resultTitle,
                      }));
                    }}
                    required
                    placeholder="Weekend wardrobe"
                  />
                </label>
                <label>
                  Short description
                  <textarea
                    value={quiz.description}
                    onChange={(e) => setQuiz((q) => ({ ...q, description: e.target.value }))}
                    rows={2}
                    placeholder="Shown on the Style quiz page"
                  />
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={quiz.published}
                    onChange={(e) => setQuiz((q) => ({ ...q, published: e.target.checked }))}
                  />
                  Show on Style quiz page
                </label>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setQuiz(starterQuiz());
                    setQuizStep(1);
                    toast("Starter quiz loaded — review questions, then save");
                  }}
                >
                  Fill with a starter quiz
                </button>
                <button className="btn btn-primary" type="button" onClick={() => setQuizStep(1)}>
                  Next: questions
                </button>
              </>
            ) : null}

            {quizStep === 1 ? (
              <>
                {quiz.questions.map((question, qi) => (
                  <fieldset key={question.id} className="admin-question">
                    <legend>
                      Question {qi + 1}
                      {quiz.questions.length > 1 ? (
                        <button
                          className="admin-inline-btn"
                          type="button"
                          onClick={() =>
                            setQuiz((current) => ({
                              ...current,
                              questions: current.questions.filter((_, i) => i !== qi),
                            }))
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </legend>
                    <input
                      placeholder="What should they choose?"
                      value={question.title}
                      onChange={(e) => updateQuestion(qi, { ...question, title: e.target.value })}
                      required
                    />
                    <input
                      placeholder="Optional helper text"
                      value={question.subtitle}
                      onChange={(e) => updateQuestion(qi, { ...question, subtitle: e.target.value })}
                    />
                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={Boolean(question.multi)}
                        onChange={(e) => updateQuestion(qi, { ...question, multi: e.target.checked })}
                      />
                      Allow more than one answer
                    </label>
                    {question.options.map((option, oi) => (
                      <div key={option.value} className="admin-option">
                        <input
                          placeholder="Emoji"
                          value={option.emoji ?? ""}
                          onChange={(e) => {
                            const options = [...question.options];
                            options[oi] = { ...option, emoji: e.target.value };
                            updateQuestion(qi, { ...question, options });
                          }}
                        />
                        <input
                          placeholder={oi === 0 ? "First choice" : "Another choice"}
                          value={option.label}
                          onChange={(e) => {
                            const options = [...question.options];
                            options[oi] = { ...option, label: e.target.value, value: option.value || `o${oi + 1}` };
                            updateQuestion(qi, { ...question, options });
                          }}
                          required={oi < 2}
                        />
                        {question.options.length > 2 ? (
                          <button
                            className="admin-inline-btn"
                            type="button"
                            onClick={() =>
                              updateQuestion(qi, {
                                ...question,
                                options: question.options.filter((_, i) => i !== oi),
                              })
                            }
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() =>
                        updateQuestion(qi, {
                          ...question,
                          options: [...question.options, { value: `o${question.options.length + 1}`, label: "", emoji: "" }],
                        })
                      }
                    >
                      Add a choice
                    </button>
                  </fieldset>
                ))}
                <div className="actions">
                  <button className="btn btn-secondary" type="button" onClick={() => setQuizStep(0)}>
                    Back
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setQuiz((q) => ({ ...q, questions: [...q.questions, emptyQuestion()] }))}
                  >
                    Add question
                  </button>
                  <button className="btn btn-primary" type="button" onClick={() => setQuizStep(2)}>
                    Next: result
                  </button>
                </div>
              </>
            ) : null}

            {quizStep === 2 ? (
              <>
                <label>
                  Result title
                  <input
                    value={quiz.resultTitle}
                    onChange={(e) => setQuiz((q) => ({ ...q, resultTitle: e.target.value }))}
                    required
                    placeholder="Your weekend uniform"
                  />
                </label>
                <label>
                  Result message
                  <textarea
                    value={quiz.resultBody}
                    onChange={(e) => setQuiz((q) => ({ ...q, resultBody: e.target.value }))}
                    rows={4}
                    required
                    placeholder="What should they do after finishing?"
                  />
                </label>
                <div className="actions">
                  <button className="btn btn-secondary" type="button" onClick={() => setQuizStep(1)}>
                    Back
                  </button>
                  {editing ? (
                    <button className="btn btn-secondary" type="button" onClick={resetQuiz}>
                      Cancel
                    </button>
                  ) : null}
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Save changes" : quiz.published ? "Publish quiz" : "Save draft"}
                  </button>
                </div>
              </>
            ) : null}
          </form>
          <div className="admin-card">
            <h2>Your quizzes</h2>
            <p className="muted">Live quizzes appear on the Style quiz page for members.</p>
            <ul className="admin-list">
              {templates.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.title}</strong>
                    <p className="muted">
                      {row.published ? "Live" : "Hidden"} · {row.questions.length} questions
                    </p>
                  </div>
                  <div className="actions">
                    <button className="btn btn-secondary" type="button" onClick={() => void togglePublished(row)}>
                      {row.published ? "Hide" : "Go live"}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => editTemplate(row)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => void deleteTemplate(row.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {!templates.length ? <p className="muted">No extra quizzes yet. Use the starter quiz to create one in a minute.</p> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
