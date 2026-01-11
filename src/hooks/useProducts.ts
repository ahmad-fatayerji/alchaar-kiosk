/* ------------------------------------------------------------------ */
/* Products state + CRUD + BULK helpers                               */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useState } from "react";
import { useMessages } from "@/contexts/MessageContext";
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
    const { notify, confirm } = useMessages();

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
                        notify({ message: `Product ${barcode} was archived because it has order history.`, variant: "warning" });
                    }
                } catch { }
            } else {
                try {
                    const info = await res.json();
                    if (res.status === 404) {
                        notify({ message: `Product ${barcode} was not found (already deleted).`, variant: "warning" });
                    } else if (res.status === 409) {
                        notify({ message: `Cannot delete product ${barcode}: it is referenced by existing orders.`, variant: "error" });
                    } else {
                        notify({ message: `Delete failed (${res.status}): ${info?.error || "unknown error"}`, variant: "error" });
                    }
                } catch {
                    notify({ message: `Delete failed with status ${res.status}.`, variant: "error" });
                }
            }
            refresh();
        },
        [refresh, notify]
    );

    /* ---- bulk delete ---------------------------------------------- */
    const bulkDelete = useCallback(
        async (codes: string[]) => {
            if (!codes.length) return;
            const confirmed = await confirm({
                message: `Delete ${codes.length} products?`,
                confirmLabel: "Delete",
                confirmVariant: "destructive",
            });
            if (!confirmed) return;

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
                if (parts.length > 1) {
                    notify({
                        title: "Bulk delete summary",
                        message: parts.join("\n"),
                        variant: "info",
                        duration: 7000,
                    });
                }
            } else {
                try {
                    const j = await res.json();
                    notify({ message: `Bulk delete failed (${res.status}): ${j?.error || "unknown error"}`, variant: "error" });
                } catch {
                    notify({ message: `Bulk delete failed with status ${res.status}.`, variant: "error" });
                }
            }
            setSelected(new Set());
            await refresh();
            setBusy(false);
        },
        [refresh, confirm, notify]
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
                // optimistic update
                setProducts((prev) => prev.map(pr => pr.barcode === String(barcode) ? { ...pr, qtyInStock: next } : pr));
                const res = await fetch(`/api/products/${barcode}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ qtyInStock: next }),
                });
                if (!res.ok) {
                    // revert on failure
                    setProducts((prev) => prev.map(pr => pr.barcode === String(barcode) ? { ...pr, qtyInStock: current } : pr));
                    notify({ message: "Stock update failed", variant: "error" });
                }
            } finally {
                // optionally silent background refresh for consistency
                refresh();
            }
        },
        [products, refresh, notify]
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
