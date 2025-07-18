"use client";

import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import type { Product } from "@/components/ProductDialog";

/* ---------- Types ------------------------------------------------- */
type FilterValue = Parameters<
    Parameters<typeof import("@/components/ProductDialog").default>[0]["onSave"]
>[1];

/* ---------- Hook -------------------------------------------------- */
export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [busy, setBusy] = useState(false);

    /* ---- GET list -------------------------------------------------- */
    const refresh = useCallback(async () => {
        const res = await fetch("/api/products");
        const txt = await res.text();
        setProducts(txt.trim() ? (JSON.parse(txt) as Product[]) : []);
    }, []);

    /* ---- CREATE / UPDATE ------------------------------------------ */
    const upsert = useCallback(
        async (p: Partial<Product>, values: FilterValue[]) => {
            setBusy(true);

            /* 1️⃣  product row */
            const url = p.barcode
                ? `/api/products/${p.barcode}`
                : "/api/products";
            const method = p.barcode ? "PATCH" : "POST";
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

            await refresh();
            setBusy(false);
        },
        [refresh],
    );

    /* ---- DELETE --------------------------------------------------- */
    const remove = useCallback(
        async (barcode: string) => {
            await fetch(`/api/products/${barcode}`, { method: "DELETE" });
            refresh();
        },
        [refresh],
    );

    /* ---- BULK image upload ---------------------------------------- */
    const bulkUpload = useCallback(
        async (files: FileList) => {
            const fd = new FormData();
            Array.from(files).forEach((f) => fd.append("files", f));
            await fetch("/api/products/bulk-thumbnails", { method: "POST", body: fd });
            refresh();
        },
        [refresh],
    );

    /* ---- EXPORT to Excel ------------------------------------------ */
    const exportExcel = useCallback(() => {
        if (products.length === 0) return;

        const data = [
            ["Barcode", "Name", "Stock", "Price"],
            ...products.map((p) => [
                p.barcode,
                p.name,
                p.qtyInStock,
                Number(p.price).toFixed(2),
            ]),
        ];

        const sheet = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, "Products");
        XLSX.writeFile(wb, "products.xlsx", { bookType: "xlsx" });
    }, [products]);

    return {
        products,
        busy,
        refresh,
        upsert,
        remove,
        bulkUpload,
        exportExcel,
    };
}
