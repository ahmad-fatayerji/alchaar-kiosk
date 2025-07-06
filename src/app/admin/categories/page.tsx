"use client";

import { useEffect, useState, FormEvent } from "react";

type Cat = {
  id: number;
  name: string;
  children: Cat[];
};

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [newName, setNewName] = useState("");

  async function load() {
    const res = await fetch("/api/categories");
    setCats(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function addRoot(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    load();
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Categories</h1>

      {/* Create root */}
      <form onSubmit={addRoot} className="mb-6 flex gap-2">
        <input
          className="border px-3 py-1"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="rounded bg-blue-600 px-3 py-1 text-white">
          Add
        </button>
      </form>

      {/* Tree */}
      <ul className="space-y-1">
        {cats.map((c) => (
          <li key={c.id}>
            <span className="font-medium">{c.name}</span>
            {c.children.length > 0 && (
              <ul className="ml-4 list-disc">
                {c.children.map((ch) => (
                  <li key={ch.id}>{ch.name}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
