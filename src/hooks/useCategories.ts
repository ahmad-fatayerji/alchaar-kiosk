/* ------------------------------------------------------------------ */
/* src/hooks/useCategories.ts                                         */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useState } from "react";

/* ---------- shared Category shape -------------------------------- */
export type Category = {
    id: number;
    name: string;
    arabicName?: string | null;
    slug: string;
    parentId: number | null;
    hasChildren?: boolean;
    children?: Category[];
};

/* ------------------------------------------------------------------ */
/* Centralised state & CRUD for categories                            */
/* ------------------------------------------------------------------ */
export function useCategories() {
    const [tree, setTree] = useState<Category[]>([]);
    const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

    /* ---- helper: fetch root list ----------------------------------- */
    const loadRoot = useCallback(async () => {
        try {
            const res = await fetch("/api/categories");
            if (!res.ok) {
                console.warn("Failed to load categories", res.status);
                return; // keep old tree
            }
            let data: Category[] | null = null;
            try {
                data = await res.json();
            } catch (e) {
                console.warn("Bad JSON from /api/categories", e);
                return;
            }
            if (Array.isArray(data)) setTree(data);
        } catch (err) {
            console.warn("Network error loading categories", err);
        }
    }, []);

    /* ---- ensure children (lazy) ------------------------------------ */
    const ensureChildren = useCallback(
        async (cat: Category) => {
            if (cat.hasChildren === false || cat.children !== undefined) return;

            setBusyIds((old) => new Set(old).add(cat.id));
            try {
                const kids: Category[] = await fetch(
                    `/api/categories/${cat.id}`,
                ).then((r) => r.json());

                cat.children = kids;                // mutate live object
                cat.hasChildren = kids.length > 0;
                setTree((t) => [...t]);             // trigger re-render
            } finally {
                setBusyIds((old) => {
                    const cp = new Set(old);
                    cp.delete(cat.id);
                    return cp;
                });
            }
        },
        [],
    );

    /* ---- CRUD helpers ---------------------------------------------- */
    const create = useCallback(
        async (parentId: number | null, name: string, arabicName?: string | null) => {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parentId, name, arabicName }),
            });
            if (!res.ok) return alert("Create category failed");

            await loadRoot();                     // ⬅️  always re-fetch
        },
        [loadRoot],
    );

    const rename = useCallback(
        async (cat: Category, name: string, arabicName?: string | null) => {
            await fetch(`/api/categories/${cat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, arabicName }),
            });
            await loadRoot();                     // ⬅️  re-fetch for consistency
        },
        [loadRoot],
    );

    const remove = useCallback(
        async (cat: Category) => {
            await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
            await loadRoot();                     // ⬅️  re-fetch after delete
        },
        [loadRoot],
    );

    return {
        tree,
        busyIds,
        loadRoot,
        ensureChildren,
        create,
        rename,
        remove,
    };
}
