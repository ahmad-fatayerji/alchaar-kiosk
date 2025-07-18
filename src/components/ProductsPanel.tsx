"use client";

import { useEffect, useState } from "react";
import ProductDialog, { Product, Category } from "./ProductDialog";
import ProductTable from "./ProductTable";
import ProductsToolbar from "./ProductsToolbar";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPanel() {
  /* data + CRUD helpers */
  const { products, busy, refresh, upsert, remove, bulkUpload, exportExcel } =
    useProducts();

  /* initial load */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* categories (for dialog) */
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.text())
      .then((t) => setCats(t.trim() ? (JSON.parse(t) as Category[]) : []));
  }, []);

  /* UI state */
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

  return (
    <>
      <ProductsToolbar
        search={search}
        onSearch={setSearch}
        onNew={() => setEditing(null)}
        onBulk={bulkUpload}
        onExport={exportExcel}
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
        onSave={upsert}
      />
    </>
  );
}
