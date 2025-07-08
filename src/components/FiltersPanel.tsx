/* ------------------------------------------------------------------ */
/* Filters CRUD panel                                                 */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/components/CategoriesPanel"; // absolute path

type FilterDef = {
  id: number;
  name: string;
  type: "RANGE" | "NUMBER" | "LABEL";
  units: string | null;
  catCount: number;
};

export default function FiltersPanel() {
  const [list, setList] = useState<FilterDef[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [selFilter, setSelFilter] = useState<FilterDef | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<number>>(new Set());

  /* modal state */
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<FilterDef["type"]>("RANGE");
  const [newUnits, setNewUnits] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  /* first load */
  useEffect(() => {
    refresh();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCats);
  }, []);

  function refresh() {
    fetch("/api/filters")
      .then((r) => r.json())
      .then(setList)
      .catch(() => setErr("Could not load filters"));
  }

  /* ---------- create ---------- */
  async function create() {
    if (!newName.trim()) return;
    setBusy(true);
    await fetch("/api/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        type: newType,
        units: newUnits.trim() || null,
      }),
    });
    setBusy(false);
    setShowNew(false);
    refresh();
  }

  /* ---------- row actions ---------- */
  async function rename(f: FilterDef) {
    const name = prompt("New name:", f.name);
    if (!name || name === f.name) return;
    await fetch(`/api/filters/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    refresh();
  }

  async function changeUnits(f: FilterDef) {
    const units = prompt("Units (empty to clear):", f.units ?? "");
    if (units === null) return;
    await fetch(`/api/filters/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ units: units || null }),
    });
    refresh();
  }

  async function del(f: FilterDef) {
    if (!confirm(`Delete filter “${f.name}”?`)) return;
    await fetch(`/api/filters/${f.id}`, { method: "DELETE" });
    refresh();
  }

  /* ---------- drawer ---------- */
  async function openDrawer(f: FilterDef) {
    console.log("open drawer for filter", f.id);
    setSelFilter(f);
    setLinkedIds(new Set());
    const ids: number[] = await fetch(`/api/filters/${f.id}/categories`).then(
      (r) => r.json()
    );
    setLinkedIds(new Set(ids));
  }

  async function toggleLink(catId: number, checked: boolean) {
    if (!selFilter) return;
    setBusy(true);
    await fetch("/api/category-filters", {
      method: checked ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: catId, filterId: selFilter.id }),
    });
    setBusy(false);
    setLinkedIds((prev) => {
      const cp = new Set(prev);
      checked ? cp.add(catId) : cp.delete(catId);
      return cp;
    });
    refresh();
  }

  /* ---------- render ---------- */
  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">🏷️ Filters</h2>
        <button
          onClick={() => setShowNew(true)}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white"
        >
          ➕ New&nbsp;filter
        </button>
      </header>

      {err && <p className="text-red-600">{err}</p>}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-100 text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Units</th>
            <th className="p-2 text-center"># cats</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((f) => (
            <tr key={f.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{f.name}</td>
              <td className="p-2">{f.type}</td>
              <td className="p-2">{f.units ?? "—"}</td>
              <td className="p-2 text-center">{f.catCount}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => rename(f)}>✏️</button>
                <button onClick={() => changeUnits(f)}>⚖️</button>
                <button
                  onClick={() => openDrawer(f)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200"
                  title="Enable / disable per category"
                >
                  📂
                </button>
                <button className="text-red-700" onClick={() => del(f)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showNew && (
        <NewFilterModal
          busy={busy}
          newName={newName}
          newType={newType}
          newUnits={newUnits}
          setNewName={setNewName}
          setNewType={setNewType}
          setNewUnits={setNewUnits}
          create={create}
          close={() => setShowNew(false)}
        />
      )}

      {selFilter && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur">
          <aside className="absolute right-0 top-0 z-50 h-full w-[24rem] overflow-y-auto bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold">
              Enable “{selFilter.name}”
            </h3>

            {cats.map((c) => (
              <label key={c.id} className="mb-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={linkedIds.has(c.id)}
                  disabled={busy}
                  onChange={(e) => toggleLink(c.id, e.target.checked)}
                />
                {c.name}
              </label>
            ))}

            <button
              onClick={() => setSelFilter(null)}
              className="mt-6 rounded bg-gray-800 px-4 py-2 text-white"
            >
              Close
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

/* ---------- modal component ---------- */
function NewFilterModal({
  busy,
  newName,
  newType,
  newUnits,
  setNewName,
  setNewType,
  setNewUnits,
  create,
  close,
}: {
  busy: boolean;
  newName: string;
  newType: "RANGE" | "NUMBER" | "LABEL";
  newUnits: string;
  setNewName: (v: string) => void;
  setNewType: (v: "RANGE" | "NUMBER" | "LABEL") => void;
  setNewUnits: (v: string) => void;
  create: () => void;
  close: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur">
      <div className="w-[26rem] rounded-lg bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold">Create new filter</h3>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-gray-700">Name</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Weight"
          />
        </label>

        <div className="mb-3">
          <p className="mb-1 text-sm text-gray-700">Type</p>
          <div className="flex gap-3">
            {(["RANGE", "NUMBER", "LABEL"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`rounded px-3 py-1 text-sm ${
                  newType === t
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-gray-700">
            Units (optional)
          </span>
          <input
            className="w-full rounded border px-3 py-2"
            value={newUnits}
            onChange={(e) => setNewUnits(e.target.value)}
            placeholder="e.g. kg"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            disabled={!newName.trim() || busy}
            onClick={create}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
