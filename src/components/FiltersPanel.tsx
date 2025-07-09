/* ------------------------------------------------------------------ */
/* Filters CRUD panel                                                 */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";

/* ─────────── Types ─────────── */
type FilterDef = {
  id: number;
  name: string;
  type: "RANGE" | "NUMBER" | "LABEL";
  units: string | null;
  catCount: number;
};

/* ─────────── Small DataTable helper ─────────── */
function DataTable<T>({
  columns,
  data,
}: {
  columns: ColumnDef<T>[];
  data: T[];
}) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="w-full text-sm">
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
  );
}

/* ------------------------------------------------------------------ */
export default function FiltersPanel() {
  const [rows, setRows] = useState<FilterDef[]>([]);

  async function refresh() {
    const data = await fetch("/api/filters").then((r) => r.json());
    setRows(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  /* ───────── create ───────── */
  async function create() {
    const name = prompt("Filter name:");
    if (!name?.trim()) return;

    const type = prompt("Type (RANGE | NUMBER | LABEL):", "LABEL")
      ?.toUpperCase()
      .trim();

    if (!["RANGE", "NUMBER", "LABEL"].includes(type ?? "")) {
      alert("Invalid type");
      return;
    }

    await fetch("/api/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });
    refresh();
  }

  /* ───────── delete ───────── */
  async function del(id: number, name: string) {
    if (!confirm(`Delete “${name}”?`)) return;
    await fetch(`/api/filters/${id}`, { method: "DELETE" });
    refresh();
  }

  /* ───────── columns ───────── */
  const cols: ColumnDef<FilterDef>[] = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>,
    },
    {
      accessorKey: "units",
      header: "Units",
      cell: ({ getValue }) => getValue<string>() ?? "—",
    },
    { accessorKey: "catCount", header: "# cats" },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-muted rounded">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
  ];

  /* ───────── render ───────── */
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={create}>
          <Plus className="mr-1.5 h-4 w-4" /> New
        </Button>
      </div>

      <DataTable columns={cols} data={rows} />
    </>
  );
}
