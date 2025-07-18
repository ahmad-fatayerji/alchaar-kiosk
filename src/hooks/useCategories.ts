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
/* Centralised state & CRUD for categories                             */
/* ------------------------------------------------------------------ */
export function useCategories() {
    const [tree, setTree] = useState<Category[]>([]);
    const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

    /* ---- load root -------------------------------------------------- */
    const loadRoot = useCallback(async () => {
        const root: Category[] = await fetch("/api/categories").then((r) => r.json());
        setTree(root);
    }, []);

    /* ---- ensure sub-children --------------------------------------- */
    const ensureChildren = useCallback(
        async (cat: Category) => {
            if (cat.hasChildren === false || cat.children !== undefined) return;

            setBusyIds((s) => new Set(s).add(cat.id));
            try {
                const kids: Category[] = await fetch(`/api/categories/${cat.id}`).then(
                    (r) => r.json(),
                );
                setTree((t) =>
                    t.map((c) =>
                        c.id === cat.id
                            ? { ...c, children: kids, hasChildren: kids.length > 0 }
                            : c,
                    ),
                );
            } finally {
                setBusyIds((s) => {
                    const cp = new Set(s);
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
            if (!res.ok) throw new Error("create failed");
            const newCat: Category = await res.json();

            setTree((t) =>
                parentId === null
                    ? [...t, newCat]
                    : t.map((c) =>
                        c.id === parentId
                            ? {
                                ...c,
                                children: [...(c.children ?? []), newCat],
                                hasChildren: true,
                            }
                            : c,
                    ),
            );
        },
        [],
    );

    const rename = useCallback(async (cat: Category, name: string) => {
        await fetch(`/api/categories/${cat.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        setTree((t) => t.map((c) => (c.id === cat.id ? { ...c, name } : c)));
    }, []);

    const remove = useCallback(async (cat: Category) => {
        await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
        const drop = (arr: Category[]): Category[] =>
            arr
                .filter((c) => c.id !== cat.id)
                .map((c) => ({ ...c, children: c.children && drop(c.children) }));
        setTree(drop);
    }, []);

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
