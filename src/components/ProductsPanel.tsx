"use client";

import { useEffect, useState } from "react";
import ProductDialog, { Product, Category } from "./ProductDialog";
import ProductTable from "./ProductTable";
import ProductsToolbar from "./ProductsToolbar";
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

  /* ---- export via server endpoint ---- */
  const exportAll = () => {
    window.location.href = "/api/products/export";
  };

  /* ---- bulk assign helper (prompt for category ID) ---- */
  const bulkAssignPrompt = () => {
    const input = prompt("Move to category ID (leave blank = none):", "");
    if (input === null) return;
    const catId = input.trim() === "" ? null : Number(input.trim());
    if (catId !== null && Number.isNaN(catId))
      return alert("Not a valid number.");
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
        onBulkAssign={bulkAssignPrompt}
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
