/* ------------------------------------------------------------------ */
/* src/hooks/useCategories.ts                                         */
/* ------------------------------------------------------------------ */
"use client";

import { useCallback, useState } from "react";
import { useMessages } from "@/contexts/MessageContext";

/* ---------- shared Category shape -------------------------------- */
export type Category = {
    id: number;
    name: string;
    arabicName?: string | null;
    slug: string;
    parentId: number | null;
    sortOrder?: number; // optional for now until all endpoints include it
    hasChildren?: boolean;
    children?: Category[];
};

/* ------------------------------------------------------------------ */
/* Centralised state & CRUD for categories                            */
/* ------------------------------------------------------------------ */
export function useCategories() {
    const [tree, setTree] = useState<Category[]>([]);
    const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
    const { notify } = useMessages();

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

    /* ---- create category ------------------------------------------ */
    const create = useCallback(
        async (parentId: number | null, name: string, arabicName?: string | null) => {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parentId, name, arabicName }),
            });
            if (!res.ok) {
                notify({ message: "Create category failed", variant: "error" });
                return;
            }
            await loadRoot();                     // always re-fetch for consistency
        },
        [loadRoot, notify],
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
        [loadRoot, notify],
    );

    const remove = useCallback(
        async (cat: Category) => {
            await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
            await loadRoot();                     // ⬅️  re-fetch after delete
        },
        [loadRoot, notify],
    );

    /* ---- reorder siblings ---------------------------------------- */
    const reorder = useCallback(
        async (parentId: number | null, orderedIds: number[]) => {
            // optimistic: rearrange in local tree first
            setTree((prev) => {
                const clone = structuredClone(prev) as Category[];
                const bucket = (parentId == null)
                    ? clone
                    : findNode(clone, parentId)?.children;
                if (bucket) {
                    console.log('[CAT-REORDER] before parentId', parentId, 'orderedIds', orderedIds, 'bucket', bucket.map(b => b.id));
                    const map = new Map(bucket.map(c => [c.id, c] as const));
                    const reordered: Category[] = [];
                    orderedIds.forEach((id, idx) => {
                        const item = map.get(id);
                        if (item) { item.sortOrder = idx + 1; reordered.push(item); }
                    });
                    // append any missing (safety)
                    bucket.forEach(c => { if (!reordered.includes(c)) reordered.push(c); });
                    if (parentId == null) {
                        console.log('[CAT-REORDER] after root', reordered.map(c => c.id));
                        return reordered; // root replaced
                    } else {
                        const parent = findNode(clone, parentId);
                        if (parent) {
                            parent.children = reordered;
                            // force parent replacement in its sibling array (or root)
                            if (parent.parentId == null) {
                                const idx = clone.findIndex(c => c.id === parent.id);
                                if (idx !== -1) clone[idx] = { ...parent };
                            } else {
                                const gp = findNode(clone, parent.parentId);
                                if (gp?.children) {
                                    const idx = gp.children.findIndex(c => c.id === parent.id);
                                    if (idx !== -1) gp.children[idx] = { ...parent };
                                }
                            }
                            console.log('[CAT-REORDER] after nested parentId', parentId, parent.children?.map(c => c.id));
                        }
                    }
                }
                return clone;
            });

            const res = await fetch('/api/categories/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentId, orderedIds }),
            });
            if (!res.ok) {
                notify({ message: "Reorder failed", variant: "error" });
                await loadRoot(); // fallback full refresh
            }
        },
        [loadRoot]
    );

    function findNode(list: Category[], id: number): Category | undefined {
        for (const c of list) {
            if (c.id === id) return c;
            if (c.children) {
                const found = findNode(c.children, id);
                if (found) return found;
            }
        }
        return undefined;
    }

    return {
        tree,
        busyIds,
        loadRoot,
        ensureChildren,
        create,
        rename,
        remove,
        reorder,
    };
}

