"use client";

import { useEffect, useState } from "react";
import ProductDialog, { Product } from "./ProductDialog";
import ProductTable from "./ProductTable";
import ProductsToolbar from "./ProductsToolbar";
import BulkAssignDialog, { Category } from "./BulkAssignDialog";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductsPanel() {
  const {
    products,
    selected,
    setSelected,
    busy,
    refresh,
    upsert,
    remove,
    bulkUpload,
    bulkDelete,
    bulkAssign,
  } = useProducts();

  /* ---------- load products on mount ---------- */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ---------- load categories once (only leaf categories) ---------- */
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    fetch("/api/categories/leaf")
      .then((r) => r.text())
      .then((t) => setCats(t.trim() ? (JSON.parse(t) as Category[]) : []));
  }, []);

  /* ---------- UI state ---------- */
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [assignOpen, setAssignOpen] = useState(false);

  /* ---------- export ---------- */
  const exportAll = () => {
    window.location.href = "/api/products/export";
  };

  /* ---------- bulk assign helper ---------- */
  const assignTo = (catId: number | null) => {
    setAssignOpen(false);
    bulkAssign([...selected], catId);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <p className="text-muted-foreground mt-1">Inventory management</p>
      </div>

      <ProductsToolbar
        search={search}
        onSearch={setSearch}
        onNew={() => setEditing(null)}
        onBulk={bulkUpload}
        onExport={exportAll}
        onBulkDelete={() => bulkDelete([...selected])}
        onBulkAssignClick={() => setAssignOpen(true)}
        disabled={busy}
        selectedCount={selected.size}
      />

      <Card>
        <CardContent className="p-0">
          <ProductTable
            data={products}
            globalFilter={search}
            selected={selected}
            setSelected={setSelected}
            onEdit={setEditing}
            onDelete={remove}
            onUploaded={refresh}
          />
        </CardContent>
      </Card>

      {/* product edit dialog */}
      <ProductDialog
        open={editing !== undefined}
        product={editing ?? null}
        cats={cats}
        busy={busy}
        onCancel={() => setEditing(undefined)}
        onSave={upsert}
      />

      {/* bulk-assign dialog */}
      <BulkAssignDialog
        open={assignOpen}
        cats={cats}
        onClose={() => setAssignOpen(false)}
        onAssign={assignTo}
      />
    </>
  );
}
