"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import FilterDialog, { FilterRow } from "./FilterDialog";
import FilterCategoriesDialog from "./FilterCategoriesDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Filters</h2>
          <p className="text-muted-foreground mt-1">
            Define product attributes and specifications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
        <SearchBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
            className="w-64"
        />

        <Button size="sm" onClick={create}>
          <Plus className="mr-1.5 h-4 w-4" />
            New Filter
        </Button>
        </div>
      </div>

      {/* table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-4 px-6 font-semibold">Name</th>
                  <th className="text-left py-4 px-6 font-semibold">Type</th>
                  <th className="text-left py-4 px-6 font-semibold">Units</th>
                  <th className="text-left py-4 px-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium">{r.name}</td>
                    <td className="py-4 px-6">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {r.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {r.units ?? "—"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {/* manage categories */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCatDlgId(r.id)}
                          title="Attach to categories"
                        >
                          <FolderTree size={14} />
                        </Button>

                        {/* edit */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditing(r)}
                          title="Edit filter"
                        >
                          <Pencil size={14} />
                        </Button>

                        {/* delete */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          disabled={busy}
                          onClick={() => remove(r.id)}
                          title="Delete filter"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
