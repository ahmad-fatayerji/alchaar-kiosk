/* ------------------------------------------------------------------ */
/* Filters CRUD panel – enables/​disables per-category                 */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FolderCog, MoreHorizontal, Plus } from "lucide-react";

/* ─────────── Types ─────────── */
type FilterDef = {
  id: number;
  name: string;
  type: "RANGE" | "NUMBER" | "LABEL";
  units: string | null;
  catCount: number;
};

type Category = { id: number; name: string };

/* ─────────── Main panel ─────────── */
export default function FiltersPanel() {
  const [rows, setRows] = useState<FilterDef[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  /* drawer state */
  const [selFilter, setSelFilter] = useState<FilterDef | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  /* ──────── data ──────── */
  const refresh = useCallback(async () => {
    const data = await fetch("/api/filters").then((r) => r.json());
    setRows(data);
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCats);
  }, [refresh]);

  /* ──────── CRUD ops ──────── */
  async function create() {
    const name = prompt("Filter name:");
    if (!name?.trim()) return;

    const type = prompt("Type (RANGE | NUMBER | LABEL):", "LABEL")
      ?.toUpperCase()
      .trim();
    if (!["RANGE", "NUMBER", "LABEL"].includes(type ?? "")) return;

    await fetch("/api/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });
    refresh();
  }

  async function del(id: number, name: string) {
    if (!confirm(`Delete “${name}”?`)) return;
    await fetch(`/api/filters/${id}`, { method: "DELETE" });
    refresh();
  }

  /* enable / disable drawer helpers */
  async function openDrawer(f: FilterDef) {
    setBusy(true);
    setSelFilter(f);
    const ids: number[] = await fetch(`/api/filters/${f.id}/categories`).then(
      (r) => r.json()
    );
    setLinkedIds(new Set(ids));
    setBusy(false);
  }

  async function toggle(catId: number, checked: boolean) {
    if (!selFilter) return;
    setBusy(true);
    await fetch("/api/category-filters", {
      method: checked ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: catId, filterId: selFilter.id }),
    });
    setLinkedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(catId) : next.delete(catId);
      return next;
    });
    setBusy(false);
    refresh();
  }

  /* ───────── table columns ───────── */
  const cols = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
    },
    {
      accessorKey: "units",
      header: "Units",
      cell: ({ getValue }) => (getValue() as string) ?? "—",
    },
    { accessorKey: "catCount", header: "# cats" },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-muted rounded">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => openDrawer(row.original)}
              className="flex items-center gap-2"
            >
              <FolderCog size={14} /> Enable / disable
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => del(row.original.id, row.original.name)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ] satisfies ColumnDef<FilterDef>[]; // ✅ typed

  /* tiny react-table wrapper (keeps bundle small) */
  const table = useReactTable({
    data: rows,
    columns: cols,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ───────── render ───────── */
  return (
    <>
      {/* header */}
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={create}>
          <Plus className="mr-1.5 h-4 w-4" /> New
        </Button>
      </div>

      {/* table */}
      <Table className="text-sm">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* enable / disable dialog */}
      <Dialog open={!!selFilter} onOpenChange={() => setSelFilter(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selFilter ? `Enable “${selFilter.name}”` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {cats.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <Checkbox
                  checked={linkedIds.has(c.id)}
                  disabled={busy}
                  /* annotate v so TS doesn’t complain */
                  onCheckedChange={(v: boolean) => toggle(c.id, v)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
