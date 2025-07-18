"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Upload } from "lucide-react";
import ProductDialog, { Product, Category } from "./ProductDialog";
import { Button } from "@/components/ui/button";
import ProductTable from "./ProductTable";
import SearchBox from "./SearchBox";

export default function ProductsPanel() {
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  /* ---------- loaders ---------- */
  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    const txt = await res.text();
    setRows(txt.trim() ? (JSON.parse(txt) as Product[]) : []);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const txt = await res.text();
    setCats(txt.trim() ? (JSON.parse(txt) as Category[]) : []);
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  /* ---------- CRUD ---------- */
  type FilterValue = Parameters<
    Parameters<typeof ProductDialog>[0]["onSave"]
  >[1];

  async function upsert(p: Partial<Product>, values: FilterValue[]) {
    setBusy(true);

    /* 1️⃣  product itself */
    const url = editing ? `/api/products/${editing.barcode}` : "/api/products";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, barcode: String(p.barcode ?? "") }),
    });

    /* 2️⃣  associated filter values */
    await fetch("/api/product-filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productBarcode: p.barcode, values }),
    });

    setBusy(false);
    setEditing(undefined);
    loadProducts();
  }

  async function remove(barcode: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${barcode}`, { method: "DELETE" });
    loadProducts();
  }

  /* ---------- bulk-image upload ---------- */
  const bulkRef = useRef<HTMLInputElement>(null);

  async function handleBulkImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));

    await fetch("/api/products/bulk-thumbnails", { method: "POST", body: fd });
    loadProducts();
    e.target.value = ""; // reset so same selection can re-trigger
  }

  /* ---------- render ---------- */
  return (
    <>
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SearchBox
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-56"
        />

        <div className="flex gap-2">
          {/* bulk upload */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkRef.current?.click()}
            title="Upload multiple images at once"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Upload&nbsp;images
          </Button>
          <input
            ref={bulkRef}
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkImages}
          />

          {/* add product */}
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* table */}
      <ProductTable
        data={rows}
        globalFilter={filter}
        onEdit={setEditing}
        onDelete={remove}
        onUploaded={loadProducts}
      />

      {/* dialog */}
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
