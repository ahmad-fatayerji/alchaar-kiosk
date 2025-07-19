/* ------------------------------------------------------------------ */
/* src/hooks/useCategories.ts                                         */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useState } from "react";

/* ---------- shared Category shape -------------------------------- */
export type Category = {
    id: number;
    name: string;
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
        const root: Category[] = await fetch("/api/categories").then((r) =>
            r.json(),
        );
        setTree(root);
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
        async (parentId: number | null, name: string) => {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parentId, name }),
            });
            if (!res.ok) return alert("Create category failed");

            await loadRoot();                     // ⬅️  always re-fetch
        },
        [loadRoot],
    );

    const rename = useCallback(
        async (cat: Category, name: string) => {
            await fetch(`/api/categories/${cat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
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
