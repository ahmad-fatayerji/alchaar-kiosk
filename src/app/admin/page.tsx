"use client";

import { useEffect, useState } from "react";
import { isAuthed, login, logout } from "@/lib/adminAuth";
import CategoriesPanel from "@/components/CategoriesPanel";

/* ------------------------------------------------------------------ */
/*  Tabs & Types                                                      */
/* ------------------------------------------------------------------ */

const tabs = ["categories", "filters", "products"] as const;
type Tab = (typeof tabs)[number];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  /* ─────────────────────── state ─────────────────────── */
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("categories");

  /* ───────── read login state on first mount ────────── */
  useEffect(() => setAuthed(isAuthed()), []);

  /* ─────────────── login helper ─────────────── */
  function handleLogin() {
    if (login(pass)) {
      setAuthed(true);
      setError("");
    } else {
      setError("Wrong password");
      setPass("");
    }
  }

  /* ───────────────────── login screen ───────────────────── */
  if (!authed) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="flex w-80 flex-col gap-4">
          <h1 className="text-center text-2xl font-semibold">Admin Login</h1>

          <input
            type="password"
            autoFocus
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="rounded border px-3 py-2"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleLogin}
            className="rounded bg-blue-600 py-2 font-medium text-white"
          >
            Enter
          </button>
        </div>
      </main>
    );
  }

  /* ───────────────────── admin workspace ───────────────────── */
  return (
    <main className="flex h-screen flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between bg-gray-800 px-6 py-3 text-white">
        <nav className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={t === tab ? "font-bold underline" : ""}
            >
              {t}
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            location.reload();
          }}
          className="text-sm opacity-80 hover:opacity-100"
        >
          Logout
        </button>
      </header>

      {/* work area */}
      <section className="flex-1 overflow-y-auto p-6">
        {tab === "categories" && <CategoriesPanel />}
        {tab === "filters" && <FiltersPanel />}
        {tab === "products" && <ProductsPanel />}
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Temporary stubs – replace with real panels later                  */
/* ------------------------------------------------------------------ */

function FiltersPanel() {
  return <p>🏷️ Filters CRUD coming soon…</p>;
}

function ProductsPanel() {
  return <p>📦 Products CRUD coming soon…</p>;
}
