/* ------------------------------------------------------------------ */
/* Categories panel – header, dialogs & thumbnail upload              */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useRef, useState } from "react";
import CategoryTree from "./CategoryTree";
import CategoryProductsDialog from "./CategoryProductsDialog";
import { useCategories } from "@/hooks/useCategories";
import { bumpThumbVersion } from "@/hooks/useThumbVersion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AdminCategoryDialog from "./AdminCategoryDialog";

export default function CategoriesPanel() {
  const { tree, busyIds, loadRoot, ensureChildren, create, rename, remove } =
    useCategories();

  const [dialogCatId, setDialogCatId] = useState<number | null>(null);
  const [thumbCatId, setThumbCatId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [catModal, setCatModal] = useState<{
    open: boolean;
    mode: "create" | "rename";
    parentId: number | null;
    targetCat: any | null;
  }>({ open: false, mode: "create", parentId: null, targetCat: null });

  /* initial load */
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

    bumpThumbVersion(); // 🔄 refresh all <CatThumb> components
    await loadRoot(); // reload tree so new props propagate
    setThumbCatId(null);
    e.target.value = ""; // reset chooser
  }

  return (
    <section>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground mt-1">
            Organize your products into categories
          </p>
        </div>
        <Button
          onClick={() =>
            setCatModal({
              open: true,
              mode: "create",
              parentId: null,
              targetCat: null,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Root Category
        </Button>
      </header>

      <CategoryTree
        cats={tree}
        busy={busyIds}
        ensure={ensureChildren}
        create={(pid) =>
          setCatModal({
            open: true,
            mode: "create",
            parentId: pid,
            targetCat: null,
          })
        }
        rename={(cat) =>
          setCatModal({
            open: true,
            mode: "rename",
            parentId: cat.parentId,
            targetCat: cat,
          })
        }
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
        ref={fileRef}
        hidden
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

      {/* Create/Rename Category Dialog */}
      <AdminCategoryDialog
        open={catModal.open}
        mode={catModal.mode}
        initialName={catModal.targetCat?.name}
        initialArabicName={(catModal.targetCat as any)?.arabicName}
        parentLabel={(() => {
          if (catModal.parentId === null) return undefined;
          const parent = tree.find((c) => c.id === catModal.parentId);
          return parent?.name;
        })()}
        onClose={() => setCatModal((s) => ({ ...s, open: false }))}
        onSave={async ({ name, arabicName }) => {
          if (catModal.mode === "create") {
            await create(catModal.parentId, name, arabicName);
          } else if (catModal.targetCat) {
            await rename(catModal.targetCat, name, arabicName);
          }
        }}
      />
    </section>
  );
}
