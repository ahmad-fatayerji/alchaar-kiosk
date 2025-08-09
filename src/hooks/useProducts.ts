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
    const refresh = useCallback(async (showArchived?: boolean) => {
        const url = showArchived ? "/api/products?includeArchived=true" : "/api/products";
        const res = await fetch(url);
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
            const res = await fetch(`/api/products/${barcode}`, { method: "DELETE" });
            if (res.ok) {
                try {
                    const info = await res.json();
                    if (info?.action === "archived") {
                        alert(`Product ${barcode} was archived because it has order history.`);
                    }
                } catch { }
            } else {
                try {
                    const info = await res.json();
                    if (res.status === 404) {
                        alert(`Product ${barcode} was not found (already deleted).`);
                    } else if (res.status === 409) {
                        alert(`Cannot delete product ${barcode}: it is referenced by existing orders.`);
                    } else {
                        alert(`Delete failed (${res.status}): ${info?.error || 'unknown error'}`);
                    }
                } catch {
                    alert(`Delete failed with status ${res.status}.`);
                }
            }
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
            const res = await fetch("/api/products/bulk", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codes }),
            });
            if (res.ok) {
                const summary = (await res.json()) as {
                    deleted: string[];
                    archived: string[];
                    conflicts: string[];
                    notFound: string[];
                    invalid: string[];
                };
                const parts: string[] = [];
                if (summary.deleted?.length) parts.push(`Deleted: ${summary.deleted.length}`);
                if (summary.archived?.length) parts.push(`Archived: ${summary.archived.length}`);
                if (summary.conflicts?.length)
                    parts.push(`Conflicts: ${summary.conflicts.length} (referenced by orders)`);
                if (summary.notFound?.length) parts.push(`Not found: ${summary.notFound.length}`);
                if (summary.invalid?.length) parts.push(`Invalid codes: ${summary.invalid.length}`);
                if (parts.length > 1) alert(parts.join("\n"));
            } else {
                try {
                    const j = await res.json();
                    alert(`Bulk delete failed (${res.status}): ${j?.error || 'unknown error'}`);
                } catch {
                    alert(`Bulk delete failed with status ${res.status}.`);
                }
            }
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

    /* ---- quick stock adjust (+/-) --------------------------------- */
    const adjustStock = useCallback(
        async (barcode: string, delta: number) => {
            const p = products.find((pr) => String(pr.barcode) === String(barcode));
            const current = Number(p?.qtyInStock ?? 0);
            const next = Math.max(0, current + Number(delta || 0));
            try {
                setBusy(true);
                await fetch(`/api/products/${barcode}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ qtyInStock: next }),
                });
                await refresh();
            } finally {
                setBusy(false);
            }
        },
        [products, refresh]
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
        adjustStock,
    };
}
