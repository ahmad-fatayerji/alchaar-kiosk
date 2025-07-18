"use client";

import { useEffect, useState } from "react";
import ProductDialog, { Product, Category } from "./ProductDialog";
import ProductTable from "./ProductTable";
import ProductsToolbar from "./ProductsToolbar";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPanel() {
  const { products, busy, refresh, upsert, remove, bulkUpload } = useProducts();

  /* initial load */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* categories for dialog */
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.text())
      .then((t) => setCats(t.trim() ? (JSON.parse(t) as Category[]) : []));
  }, []);

  /* UI state */
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

  /* wrapper closes dialog after save */
  const handleSave = async (p: Partial<Product>, values: any[]) => {
    const isNew = editing === null; // ← brand-new product?
    await upsert(p, values);
    setEditing(undefined); // close dialog
  };

  /* Excel export */
  const exportAll = () => {
    window.location.href = "/api/products/export";
  };

  return (
    <>
      <ProductsToolbar
        search={search}
        onSearch={setSearch}
        onNew={() => setEditing(null)}
        onBulk={bulkUpload}
        onExport={exportAll}
        disabled={busy}
      />

      <ProductTable
        data={products}
        globalFilter={search}
        onEdit={setEditing}
        onDelete={remove}
        onUploaded={refresh}
      />

      <ProductDialog
        open={editing !== undefined}
        product={editing ?? null}
        cats={cats}
        busy={busy}
        onCancel={() => setEditing(undefined)}
        onSave={handleSave} /* uses wrapper */
      />
    </>
  );
}
