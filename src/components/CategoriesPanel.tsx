/* ------------------------------------------------------------------ */
/* Categories panel – header, dialogs & thumbnail upload              */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useRef, useState } from "react";
import CategoryTree from "./CategoryTree";
import CategoryProductsDialog from "./CategoryProductsDialog";
import { useCategories } from "@/hooks/useCategories";

export default function CategoriesPanel() {
  const { tree, busyIds, loadRoot, ensureChildren, create, rename, remove } =
    useCategories();

  const [dialogCatId, setDialogCatId] = useState<number | null>(null);
  const [thumbCatId, setThumbCatId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* first load */
  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  /* single-thumb upload */
  async function onThumb(e: React.ChangeEvent<HTMLInputElement>) {
    if (!thumbCatId || !e.target.files?.[0]) return;
    const fd = new FormData();
    fd.append("file", e.target.files[0]);

    await fetch(`/api/categories/${thumbCatId}/thumbnail`, {
      method: "POST",
      body: fd,
    });
    setThumbCatId(null);
    e.target.value = "";
  }

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">🗂️ Categories</h2>
        <button
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
          onClick={() => {
            const name = prompt("Root category name:");
            if (name?.trim()) create(null, name.trim());
          }}
        >
          ➕ Root&nbsp;category
        </button>
      </header>

      <CategoryTree
        cats={tree}
        busy={busyIds}
        ensure={ensureChildren}
        create={(pid) => {
          const name = prompt("New category name:");
          if (name?.trim()) create(pid, name.trim());
        }}
        rename={(cat) => {
          const name = prompt("Rename category:", cat.name);
          if (name?.trim() && name !== cat.name) rename(cat, name.trim());
        }}
        remove={(cat) => {
          if (confirm(`Delete “${cat.name}” and all its children?`))
            remove(cat);
        }}
        openDialog={(id) => setDialogCatId(id)}
        uploadThumb={(id) => {
          setThumbCatId(id);
          fileRef.current?.click();
        }}
      />

      {/* hidden file input */}
      <input
        hidden
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onThumb}
      />

      {/* products dialog */}
      <CategoryProductsDialog
        open={dialogCatId !== null}
        catId={dialogCatId ?? 0}
        onClose={() => setDialogCatId(null)}
        onSaved={() => {}}
      />
    </section>
  );
}
