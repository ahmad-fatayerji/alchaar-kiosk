/* ------------------------------------------------------------------ */
/* src/hooks/useProducts.ts                                           */
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

            /* Does this barcode already exist? */
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

    /* ---- delete --------------------------------------------------- */
    const remove = useCallback(
        async (barcode: string) => {
            await fetch(`/api/products/${barcode}`, { method: "DELETE" });
            refresh();
        },
        [refresh]
    );

    /* ---- bulk thumbnail upload ----------------------------------- */
    const bulkUpload = useCallback(
        async (files: FileList) => {
            const fd = new FormData();
            Array.from(files).forEach((f) => fd.append("files", f));
            await fetch("/api/products/bulk-thumbnails", { method: "POST", body: fd });
            bumpThumbVersion();          // 🔄 refresh all thumbnails
            refresh();
        },
        [refresh]
    );

    return {
        products,
        busy,
        refresh,
        upsert,
        remove,
        bulkUpload,
    };
}
