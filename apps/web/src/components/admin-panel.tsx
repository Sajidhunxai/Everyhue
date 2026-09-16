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

export function AdminPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "users" | "quizzes">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [quiz, setQuiz] = useState({
    id: "",
    title: "",
    description: "",
    published: false,
    resultTitle: "",
    resultBody: "",
    questions: [emptyQuestion()],
  });

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
  }

  useEffect(() => {
    void load();
  }, []);

  const editing = Boolean(quiz.id);

  const questionPreview = useMemo(() => quiz.questions.filter((q) => q.title.trim()).length, [quiz.questions]);

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
    setEmail("");
    setName("");
    setPassword("");
    toast("User created");
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
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: quiz.id || undefined,
        title: quiz.title,
        description: quiz.description,
        published: quiz.published,
        resultTitle: quiz.resultTitle,
        resultBody: quiz.resultBody,
        questions: quiz.questions.map((q, i) => ({
          ...q,
          id: q.id || `q${i + 1}`,
          options: q.options.filter((o) => o.label.trim()),
        })),
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      toast(body?.error ?? "Could not save quiz", "error");
      return;
    }
    toast(editing ? "Quiz updated" : "Quiz created");
    setQuiz({
      id: "",
      title: "",
      description: "",
      published: false,
      resultTitle: "",
      resultBody: "",
      questions: [emptyQuestion()],
    });
    void load();
  }

  function editTemplate(row: QuizTemplate) {
    setTab("quizzes");
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

  async function deleteTemplate(id: string) {
    if (!window.confirm("Delete this quiz?")) return;
    await fetch(`/api/admin/templates?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    toast("Quiz deleted");
    void load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin/login");
  }

  return (
    <section className="admin-page">
      <header className="admin-hero">
        <div>
          <p className="section-kicker">Every Hue</p>
          <h1>Admin</h1>
          <p className="lead">Users, extra quizzes, and published plans.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <div className="chip-select admin-tabs">
        {(["overview", "users", "quizzes"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip-toggle ${tab === id ? "chip-toggle-on" : ""}`}
            onClick={() => setTab(id)}
          >
            {id === "overview" ? "Overview" : id === "users" ? "Users" : "Quizzes"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="admin-metrics">
          <article>
            <strong>{stats?.users ?? "—"}</strong>
            <span>Users</span>
          </article>
          <article>
            <strong>{stats?.analyses ?? "—"}</strong>
            <span>Analyses</span>
          </article>
          <article>
            <strong>{stats?.quizzes ?? "—"}</strong>
            <span>Completed quizzes</span>
          </article>
          <article>
            <strong>{stats?.templates ?? "—"}</strong>
            <span>Quiz templates</span>
          </article>
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="admin-grid">
          <form className="admin-card form-grid" onSubmit={(e) => void createUser(e)}>
            <h2>Create user</h2>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </label>
            <button className="btn btn-primary" type="submit">
              Add user
            </button>
          </form>
          <div className="admin-card">
            <h2>Accounts</h2>
            <ul className="admin-list">
              {users.map((user) => (
                <li key={user.id}>
                  <div>
                    <strong>
                      {user.name || "Unnamed"} {user.isAdmin ? <span className="admin-pill">Admin</span> : null}
                    </strong>
                    <p className="muted">
                      {user.email} · {user.analyses} analyses · {user.wardrobe} wardrobe
                    </p>
                  </div>
                  {!user.isAdmin ? (
                    <button className="btn btn-secondary" type="button" onClick={() => void deleteUser(user.id)}>
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "quizzes" ? (
        <div className="admin-grid">
          <form className="admin-card form-grid" onSubmit={(e) => void saveQuiz(e)}>
            <h2>{editing ? "Edit quiz" : "Create quiz"}</h2>
            <p className="muted">
              Published quizzes appear on the Style quiz page next to the seasonal plan. {questionPreview} question
              {questionPreview === 1 ? "" : "s"} ready.
            </p>
            <label>
              Title
              <input value={quiz.title} onChange={(e) => setQuiz((q) => ({ ...q, title: e.target.value }))} required />
            </label>
            <label>
              Description
              <textarea value={quiz.description} onChange={(e) => setQuiz((q) => ({ ...q, description: e.target.value }))} rows={2} />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={quiz.published}
                onChange={(e) => setQuiz((q) => ({ ...q, published: e.target.checked }))}
              />
              Publish for members
            </label>
            {quiz.questions.map((question, qi) => (
              <fieldset key={question.id} className="admin-question">
                <legend>Question {qi + 1}</legend>
                <input
                  placeholder="Question title"
                  value={question.title}
                  onChange={(e) =>
                    setQuiz((q) => {
                      const questions = [...q.questions];
                      questions[qi] = { ...question, title: e.target.value };
                      return { ...q, questions };
                    })
                  }
                  required
                />
                <input
                  placeholder="Helper text"
                  value={question.subtitle}
                  onChange={(e) =>
                    setQuiz((q) => {
                      const questions = [...q.questions];
                      questions[qi] = { ...question, subtitle: e.target.value };
                      return { ...q, questions };
                    })
                  }
                />
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={Boolean(question.multi)}
                    onChange={(e) =>
                      setQuiz((q) => {
                        const questions = [...q.questions];
                        questions[qi] = { ...question, multi: e.target.checked };
                        return { ...q, questions };
                      })
                    }
                  />
                  Allow multiple answers
                </label>
                {question.options.map((option, oi) => (
                  <div key={option.value} className="admin-option">
                    <input
                      placeholder="Emoji"
                      value={option.emoji ?? ""}
                      onChange={(e) =>
                        setQuiz((q) => {
                          const questions = [...q.questions];
                          const options = [...question.options];
                          options[oi] = { ...option, emoji: e.target.value };
                          questions[qi] = { ...question, options };
                          return { ...q, questions };
                        })
                      }
                    />
                    <input
                      placeholder="Option label"
                      value={option.label}
                      onChange={(e) =>
                        setQuiz((q) => {
                          const questions = [...q.questions];
                          const options = [...question.options];
                          options[oi] = { ...option, label: e.target.value, value: option.value || `o${oi + 1}` };
                          questions[qi] = { ...question, options };
                          return { ...q, questions };
                        })
                      }
                      required={oi < 2}
                    />
                  </div>
                ))}
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    setQuiz((q) => {
                      const questions = [...q.questions];
                      questions[qi] = {
                        ...question,
                        options: [...question.options, { value: `o${question.options.length + 1}`, label: "", emoji: "" }],
                      };
                      return { ...q, questions };
                    })
                  }
                >
                  Add option
                </button>
              </fieldset>
            ))}
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setQuiz((q) => ({ ...q, questions: [...q.questions, emptyQuestion()] }))}
            >
              Add question
            </button>
            <label>
              Result title
              <input
                value={quiz.resultTitle}
                onChange={(e) => setQuiz((q) => ({ ...q, resultTitle: e.target.value }))}
                required
              />
            </label>
            <label>
              Result message
              <textarea
                value={quiz.resultBody}
                onChange={(e) => setQuiz((q) => ({ ...q, resultBody: e.target.value }))}
                rows={3}
                required
              />
            </label>
            <div className="actions">
              <button className="btn btn-primary" type="submit">
                {editing ? "Save quiz" : "Create quiz"}
              </button>
              {editing ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    setQuiz({
                      id: "",
                      title: "",
                      description: "",
                      published: false,
                      resultTitle: "",
                      resultBody: "",
                      questions: [emptyQuestion()],
                    })
                  }
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
          <div className="admin-card">
            <h2>Published & drafts</h2>
            <ul className="admin-list">
              {templates.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.title}</strong>
                    <p className="muted">
                      {row.published ? "Published" : "Draft"} · {row.questions.length} questions
                    </p>
                  </div>
                  <div className="actions">
                    <button className="btn btn-secondary" type="button" onClick={() => editTemplate(row)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => void deleteTemplate(row.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {!templates.length ? <p className="muted">No extra quizzes yet.</p> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
