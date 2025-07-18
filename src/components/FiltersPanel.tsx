"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import FilterDialog, { FilterRow } from "./FilterDialog";
import FilterCategoriesDialog from "./FilterCategoriesDialog";

export default function FiltersPanel() {
  const [rows, setRows] = useState<FilterRow[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FilterRow | null>(null);
  const [busy, setBusy] = useState(false);

  /* NEW: state for “manage categories” dialog */
  const [catDlgId, setCatDlgId] = useState<number | null>(null);

  /* ---------- load list ---------- */
  async function load() {
    const res = await fetch("/api/filters");
    setRows(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  /* ---------- create ---------- */
  async function create() {
    const name = prompt("New filter name:");
    if (!name?.trim()) return;

    const type = prompt("Type? label / number / range", "label")?.toUpperCase();
    if (!["LABEL", "NUMBER", "RANGE"].includes(type ?? ""))
      return alert("Bad type");

    await fetch("/api/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });
    load();
  }

  /* ---------- delete ---------- */
  async function remove(id: number) {
    if (!confirm("Delete this filter?")) return;
    setBusy(true);
    await fetch(`/api/filters/${id}`, { method: "DELETE" });
    setBusy(false);
    load();
  }

  const shown = rows.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------- render ---------- */
  return (
    <>
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SearchBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />

        <Button size="sm" onClick={create}>
          <Plus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>

      {/* table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-2">Name</th>
            <th className="py-2 pr-2">Type</th>
            <th className="py-2 pr-2">Units</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr
              key={r.id}
              className="border-b last:border-0 hover:bg-muted/50 transition-colors"
            >
              <td className="py-2 pr-2">{r.name}</td>
              <td className="py-2 pr-2">{r.type}</td>
              <td className="py-2 pr-2">{r.units ?? "—"}</td>
              <td className="py-2 whitespace-nowrap">
                {/* manage categories */}
                <Button
                  variant="outline"
                  size="icon"
                  className="mr-1.5 h-8 w-8"
                  onClick={() => setCatDlgId(r.id)}
                  title="Attach to categories"
                >
                  <FolderTree size={14} />
                </Button>

                {/* edit */}
                <Button
                  variant="outline"
                  size="icon"
                  className="mr-1.5 h-8 w-8"
                  onClick={() => setEditing(r)}
                  title="Edit filter"
                >
                  <Pencil size={14} />
                </Button>

                {/* delete */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={busy}
                  onClick={() => remove(r.id)}
                  title="Delete filter"
                >
                  <Trash size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* edit dialog */}
      <FilterDialog
        open={editing !== null}
        filter={editing}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      {/* categories dialog */}
      <FilterCategoriesDialog
        open={catDlgId !== null}
        filterId={catDlgId}
        onClose={() => setCatDlgId(null)}
        onSaved={load}
      />
    </>
  );
}
