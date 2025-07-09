/* ------------------------------------------------------------------ */
/* Products CRUD panel                                                */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal } from "lucide-react";

/* ─────────── Types ─────────── */
type Product = {
  barcode: string; // string on the client
  name: string;
  price: string;
  qtyInStock: number;
  categoryId: number;
  category: { id: number; name: string };
};

type Category = { id: number; name: string };

/* ─────────── Local DataTable wrapper ─────────── */
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

/* ─────────── Main panel ─────────── */
export default function ProductsPanel() {
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  /* reload helpers */
  const refresh = useCallback(async () => {
    const res = await fetch("/api/products");
    if (!res.ok) return setRows([]); // 4xx / 5xx → empty table

    const text = await res.text();
    if (!text.trim()) return setRows([]); // 204 / empty → empty table

    setRows(JSON.parse(text));
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCats);
  }, [refresh]);

  /* create / update */
  async function upsert(p: Partial<Product>) {
    setBusy(true);

    // make sure barcode is a plain string before JSON-ifying
    const payload = { ...p, barcode: String(p.barcode ?? "") };

    const url = editing ? `/api/products/${editing.barcode}` : "/api/products";
    const method = editing ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setBusy(false);
    setEditing(undefined);
    refresh();
  }

  /* delete */
  async function remove(barcode: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${barcode}`, { method: "DELETE" });
    refresh();
  }

  /* columns */
  const cols: ColumnDef<Product>[] = [
    { accessorKey: "barcode", header: "Barcode" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category.name", header: "Category" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => `£${getValue()}`,
    },
    {
      accessorKey: "qtyInStock",
      header: "Stock",
      cell: ({ getValue }) =>
        Number(getValue()) > 0 ? (
          getValue()
        ) : (
          <Badge variant="destructive">0</Badge>
        ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          prod={row.original}
          onEdit={() => setEditing(row.original)}
          onDelete={() => remove(row.original.barcode)}
        />
      ),
    },
  ];

  /* render */
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setEditing(null)}>
          <Plus className="mr-1.5 h-4 w-4" /> New
        </Button>
      </div>

      <DataTable columns={cols} data={rows} />

      <ProdDialog
        open={editing !== undefined}
        product={editing ?? null}
        cats={cats}
        busy={busy}
        onCancel={() => setEditing(undefined)}
        onSave={upsert}
      />
    </>
  );
}

/* ─────────── row dropdown ─────────── */
function RowActions({
  prod,
  onEdit,
  onDelete,
}: {
  prod: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded hover:bg-muted">
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─────────── dialog ─────────── */
function ProdDialog({
  open,
  product,
  cats,
  busy,
  onCancel,
  onSave,
}: {
  open: boolean;
  product: Product | null; // null = brand-new
  cats: Category[];
  busy: boolean;
  onCancel: () => void;
  onSave: (p: Partial<Product>) => void;
}) {
  const [form, setForm] = useState(() => ({
    barcode: product?.barcode ?? "",
    name: product?.name ?? "",
    price: product?.price ?? "",
    stock: product?.qtyInStock.toString() ?? "",
    catId:
      product?.categoryId.toString() ??
      (cats.length ? cats[0].id.toString() : ""),
  }));

  useEffect(() => {
    setForm({
      barcode: product?.barcode ?? "",
      name: product?.name ?? "",
      price: product?.price ?? "",
      stock: product?.qtyInStock.toString() ?? "",
      catId:
        product?.categoryId.toString() ??
        (cats.length ? cats[0].id.toString() : ""),
    });
  }, [product, cats]);

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  const disabled =
    !form.barcode || !form.name.trim() || !form.price || !form.catId;

  return (
    <Dialog open={open} onOpenChange={open ? onCancel : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Barcode</Label>
              <Input
                value={form.barcode}
                disabled={!!product}
                onChange={(e) => upd("barcode", e.target.value)}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={form.catId} onValueChange={(v) => upd("catId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => upd("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => upd("price", e.target.value)}
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => upd("stock", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={disabled || busy}
            onClick={() =>
              onSave({
                barcode: form.barcode, // string → stringify OK
                categoryId: Number(form.catId),
                name: form.name.trim(),
                price: form.price,
                qtyInStock: Number(form.stock || 0),
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
