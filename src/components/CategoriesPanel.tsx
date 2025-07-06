"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children: Category[];
};

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export default function CategoriesPanel() {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ───────────── fetch on mount ───────────── */
  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    res.ok ? setTree(await res.json()) : setError("Failed to load");
    setLoading(false);
  };

  /* ───────────── helpers  ───────────── */
  const post = async (body: unknown) =>
    fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const patch = async (id: number, body: unknown) =>
    fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const del = async (id: number) =>
    fetch(`/api/categories/${id}`, { method: "DELETE" });

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex gap-10">
      {/* ---------- tree ---------- */}
      <div className="w-1/2">
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        <CategoryTree
          nodes={tree}
          onRefresh={refresh}
          onDelete={del}
          onRename={patch}
          onAdd={post}
        />
      </div>

      {/* ---------- add root ---------- */}
      <RootAdder onAdd={async (name) => await post({ name }).then(refresh)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recursive tree                                                     */
/* ------------------------------------------------------------------ */

function CategoryTree({
  nodes,
  onRefresh,
  onDelete,
  onRename,
  onAdd,
}: {
  nodes: Category[];
  onRefresh: () => void;
  onDelete: (id: number) => Promise<Response>;
  onRename: (id: number, body: unknown) => Promise<Response>;
  onAdd: (body: unknown) => Promise<Response>;
}) {
  return (
    <ul className="ml-4 list-disc space-y-2">
      {nodes.map((c) => (
        <li key={c.id}>
          <span className="font-medium">{c.name}</span>
          <button
            className="ml-2 text-xs text-blue-600"
            onClick={async () => {
              const name = prompt("New sub-category name");
              if (name) await onAdd({ name, parentId: c.id }).then(onRefresh);
            }}
          >
            +sub
          </button>
          <button
            className="ml-2 text-xs text-green-600"
            onClick={async () => {
              const name = prompt("Rename", c.name);
              if (name && name !== c.name)
                await onRename(c.id, { name }).then(onRefresh);
            }}
          >
            rename
          </button>
          <button
            className="ml-2 text-xs text-red-600"
            onClick={async () => {
              if (confirm("Delete?")) await onDelete(c.id).then(onRefresh);
            }}
          >
            delete
          </button>

          {c.children?.length > 0 && (
            <CategoryTree
              nodes={c.children}
              onRefresh={onRefresh}
              onDelete={onDelete}
              onRename={onRename}
              onAdd={onAdd}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Add root category                                                  */
/* ------------------------------------------------------------------ */

function RootAdder({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="w-1/2">
      <h2 className="mb-3 text-lg font-semibold">New root category</h2>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await onAdd(name.trim());
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border px-3 py-1"
          placeholder="Name"
        />
        <button className="rounded bg-blue-600 px-4 py-1 text-white">
          Add
        </button>
      </form>
    </div>
  );
}
