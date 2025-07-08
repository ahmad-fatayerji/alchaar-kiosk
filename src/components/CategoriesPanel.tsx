/* ------------------------------------------------------------------ */
/* Categories CRUD tree – client component                            */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useState } from "react";

/* ─────────── Types ─────────── */
export type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  hasChildren?: boolean;
  children?: Category[];
};

/* ─────────── Pure helpers ─────────── */
const attachChildren = (
  t: Category[],
  id: number,
  kids: Category[]
): Category[] =>
  t.map((c) =>
    c.id === id
      ? { ...c, children: kids, hasChildren: kids.length > 0 }
      : { ...c, children: c.children && attachChildren(c.children, id, kids) }
  );

const markLeaf = (t: Category[], id: number): Category[] =>
  t.map((c) =>
    c.id === id
      ? { ...c, hasChildren: false, children: [] }
      : { ...c, children: c.children && markLeaf(c.children, id) }
  );

const updateName = (t: Category[], id: number, name: string): Category[] =>
  t.map((c) =>
    c.id === id
      ? { ...c, name }
      : { ...c, children: c.children && updateName(c.children, id, name) }
  );

const removeCat = (t: Category[], id: number): Category[] =>
  t
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, children: c.children && removeCat(c.children, id) }));

/* ------------------------------------------------------------------ */
export default function CategoriesPanel() {
  const [tree, setTree] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [busyIds, setBusy] = useState<Set<number>>(new Set());
  const [openIds, setOpen] = useState<Set<number>>(new Set());

  /* -------------------- initial load ----------------------------- */
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setTree)
      .catch(() => setError("Failed to load categories"));
  }, []);

  /* -------------------- helpers --------------------------------- */
  const ensureChildren = async (cat: Category) => {
    if (cat.hasChildren === false) return;
    if (cat.children !== undefined || busyIds.has(cat.id)) return;

    setBusy((s) => new Set(s).add(cat.id));
    try {
      const kids: Category[] = await fetch(`/api/categories/${cat.id}`).then(
        (r) => r.json()
      );
      setTree((t) =>
        kids.length ? attachChildren(t, cat.id, kids) : markLeaf(t, cat.id)
      );
    } catch {
      setError("Failed to load sub-categories");
    } finally {
      setBusy((s) => {
        const cp = new Set(s);
        cp.delete(cat.id);
        return cp;
      });
    }
  };

  /* -------------------- CRUD ops -------------------------------- */
  const create = async (parentId: number | null) => {
    const name = prompt("New category name:");
    if (!name?.trim()) return;

    const resp = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, name }),
    });
    if (!resp.ok) return alert("Create failed");

    const newCat: Category = await resp.json();
    if (parentId === null) {
      setTree((t) => [...t, newCat]);
    } else {
      setTree((t) =>
        attachChildren(t, parentId, [
          ...(findNode(t, parentId)?.children ?? []),
          newCat,
        ])
      );
      setOpen((ids) => new Set(ids).add(parentId));
    }
  };

  const rename = async (cat: Category) => {
    const name = prompt("Rename category:", cat.name);
    if (!name || name === cat.name) return;

    const resp = await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!resp.ok) return alert("Rename failed");

    setTree((t) => updateName(t, cat.id, name));
  };

  const del = async (cat: Category) => {
    if (!confirm(`Delete “${cat.name}” and all its children?`)) return;
    const resp = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (!resp.ok) return alert("Delete failed");

    setTree((t) => removeCat(t, cat.id));
    setOpen((ids) => {
      const cp = new Set(ids);
      cp.delete(cat.id);
      return cp;
    });
  };

  /* -------------------- tree utils ------------------------------ */
  const findNode = (t: Category[], id: number): Category | undefined =>
    t.find((c) => c.id === id) ||
    t.flatMap((c) => c.children ?? []).find((n) => n?.id === id);

  const toggle = async (cat: Category) => {
    const open = openIds.has(cat.id);
    if (open) {
      setOpen((ids) => {
        const cp = new Set(ids);
        cp.delete(cat.id);
        return cp;
      });
    } else {
      await ensureChildren(cat);
      setOpen((ids) => new Set(ids).add(cat.id));
    }
  };

  /* -------------------- recursive node -------------------------- */
  const Node = ({ cat }: { cat: Category }) => {
    const open = openIds.has(cat.id);
    const busy = busyIds.has(cat.id);

    const showArrow =
      cat.hasChildren !== false &&
      (cat.children === undefined || (cat.children?.length ?? 0) > 0);

    return (
      <li className="select-none">
        <div className="flex items-center gap-1">
          {showArrow && (
            <button
              className="w-4 text-xs text-gray-500"
              disabled={busy}
              onClick={() => toggle(cat)}
            >
              {busy ? "⏳" : open ? "▼" : "▶"}
            </button>
          )}

          <span className="mr-2">{cat.name}</span>

          <button
            title="Add sub-category"
            className="text-green-700"
            onClick={() => create(cat.id)}
          >
            ➕
          </button>
          <button
            title="Rename"
            className="text-blue-700"
            onClick={() => rename(cat)}
          >
            ✏️
          </button>
          <button
            title="Delete"
            className="text-red-700"
            onClick={() => del(cat)}
          >
            🗑️
          </button>
        </div>

        {open && cat.children?.length! > 0 && (
          <ul className="ml-4 list-disc space-y-1">
            {cat.children!.map((ch) => (
              <Node key={ch.id} cat={ch} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  /* -------------------- render ------------------------------ */
  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">🗂️ Categories</h2>
        <button
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white"
          onClick={() => create(null)}
        >
          ➕ Root&nbsp;category
        </button>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <ul className="list-disc space-y-1">
        {tree.map((cat) => (
          <Node key={cat.id} cat={cat} />
        ))}
      </ul>
    </section>
  );
}
