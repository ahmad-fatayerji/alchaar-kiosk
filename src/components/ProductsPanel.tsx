"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import ProductTable from "./ProductTable";
import ProductDialog, { Product, Category } from "./ProductDialog";
import { Button } from "@/components/ui/button";

export default function ProductsPanel() {
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  /* ---------- loaders ---------- */
  const refresh = useCallback(async () => {
    const r = await fetch("/api/products");
    const txt = await r.text();
    setRows(txt.trim() ? JSON.parse(txt) : []);
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCats);
  }, [refresh]);

  /* ---------- CRUD calls ---------- */
  async function upsert(p: Partial<Product>) {
    setBusy(true);
    const url = editing ? `/api/products/${editing.barcode}` : "/api/products";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, barcode: String(p.barcode ?? "") }),
    });
    setBusy(false);
    setEditing(undefined);
    refresh();
  }

  async function remove(barcode: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${barcode}`, { method: "DELETE" });
    refresh();
  }

  /* ---------- render ---------- */
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setEditing(null)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>

      <ProductTable data={rows} onEdit={setEditing} onDelete={remove} />

      <ProductDialog
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
