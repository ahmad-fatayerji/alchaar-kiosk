/* ------------------------------------------------------------------ */
/* Products state + CRUD + BULK helpers                               */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useState } from "react";
import type { Product } from "@/components/ProductDialog";
import { bumpThumbVersion } from "@/hooks/useThumbVersion";

/* ---------- Types ------------------------------------------------ */
type FilterValue = Parameters<
    Parameters<typeof import("@/components/ProductDialog").default>[0]["onSave"]
>[1];

/* ---------- Hook ------------------------------------------------- */
export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [busy, setBusy] = useState(false);

    /* NEW: set of selected barcodes for bulk ops */
    const [selected, setSelected] = useState<Set<string>>(new Set());

    /* ---- list loader ---------------------------------------------- */
    const refresh = useCallback(async () => {
        const res = await fetch("/api/products");
        const txt = await res.text();
        setProducts(txt.trim() ? (JSON.parse(txt) as Product[]) : []);
    }, []);

    /* ---- create / update ------------------------------------------ */
    const upsert = useCallback(
        async (p: Partial<Product>, values: FilterValue[]) => {
            setBusy(true);

            const exists = products.some(
                (prod) => prod.barcode === String(p.barcode ?? "")
            );
            const url = exists ? `/api/products/${p.barcode}` : "/api/products";
            const method = exists ? "PATCH" : "POST";

            /* 1️⃣ product row */
            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...p, barcode: String(p.barcode ?? "") }),
            });

            /* 2️⃣ associated filter values */
            await fetch("/api/product-filters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productBarcode: String(p.barcode ?? ""),
                    values,
                }),
            });

            await refresh();
            setBusy(false);
        },
        [products, refresh]
    );

    /* ---- single delete -------------------------------------------- */
    const remove = useCallback(
        async (barcode: string) => {
            await fetch(`/api/products/${barcode}`, { method: "DELETE" });
            refresh();
        },
        [refresh]
    );

    /* ---- bulk delete ---------------------------------------------- */
    const bulkDelete = useCallback(
        async (codes: string[]) => {
            if (!codes.length) return;
            if (!confirm(`Delete ${codes.length} products?`)) return;

            setBusy(true);
            await fetch("/api/products/bulk", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codes }),
            });
            setSelected(new Set());
            await refresh();
            setBusy(false);
        },
        [refresh]
    );

    /* ---- bulk assign to category ---------------------------------- */
    const bulkAssign = useCallback(
        async (codes: string[], categoryId: number | null) => {
            if (!codes.length) return;

            setBusy(true);
            await fetch("/api/category-products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId,
                    add: codes,
                    remove: [],
                }),
            });
            setSelected(new Set());
            await refresh();
            setBusy(false);
        },
        [refresh]
    );

    /* ---- bulk thumbnail upload ----------------------------------- */
    const bulkUpload = useCallback(
        async (files: FileList) => {
            const fd = new FormData();
            Array.from(files).forEach((f) => fd.append("files", f));
            await fetch("/api/products/bulk-thumbnails", { method: "POST", body: fd });
            bumpThumbVersion(); // refresh thumbnails
            refresh();
        },
        [refresh]
    );

    return {
        /* data */
        products,
        selected,
        busy,
        /* setters */
        setSelected,
        /* operations */
        refresh,
        upsert,
        remove,
        bulkDelete,
        bulkAssign,
        bulkUpload,
    };
}
