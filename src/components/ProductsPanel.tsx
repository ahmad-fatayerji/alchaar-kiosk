"use client";

import { useEffect, useState } from "react";
import ProductDialog, { Product } from "./ProductDialog";
import ProductTable from "./ProductTable";
import ProductsToolbar from "./ProductsToolbar";
import BulkAssignDialog, { Category } from "./BulkAssignDialog";
import { useProducts } from "@/hooks/useProducts";

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

  /* ---------- load categories once ---------- */
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    fetch("/api/categories")
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

      <ProductTable
        data={products}
        globalFilter={search}
        selected={selected}
        setSelected={setSelected}
        onEdit={setEditing}
        onDelete={remove}
        onUploaded={refresh}
      />

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
