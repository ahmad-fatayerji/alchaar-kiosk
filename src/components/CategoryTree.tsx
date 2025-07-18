"use client";

import { useState } from "react";
import type { Category } from "@/hooks/useCategories";
import CatThumb from "./CatThumb";

type Props = {
  cats: Category[];
  busy: Set<number>;
  /* actions */
  ensure(cat: Category): Promise<void>;
  create(parentId: number | null): void;
  rename(cat: Category): void;
  remove(cat: Category): void;
  openDialog(catId: number): void;
  uploadThumb(catId: number): void;
};

export default function CategoryTree({
  cats,
  busy,
  ensure,
  create,
  rename,
  remove,
  openDialog,
  uploadThumb,
}: Props) {
  const [openIds, setOpen] = useState<Set<number>>(new Set());

  const toggle = async (cat: Category) => {
    if (openIds.has(cat.id)) {
      setOpen((s) => {
        const cp = new Set(s);
        cp.delete(cat.id);
        return cp;
      });
    } else {
      await ensure(cat);
      setOpen((s) => new Set(s).add(cat.id));
    }
  };

  const Node = ({ cat }: { cat: Category }) => {
    const open = openIds.has(cat.id);
    const loading = busy.has(cat.id);

    const arrowVisible =
      cat.hasChildren !== false &&
      (cat.children === undefined || (cat.children?.length ?? 0) > 0);

    return (
      <li className="flex items-center gap-1 select-none">
        <CatThumb id={cat.id} />

        {arrowVisible && (
          <button
            className="w-4 text-xs text-gray-500"
            disabled={loading}
            onClick={() => toggle(cat)}
          >
            {loading ? "⏳" : open ? "▼" : "▶"}
          </button>
        )}

        <span className="mr-2">{cat.name}</span>

        <button title="Upload thumb" onClick={() => uploadThumb(cat.id)}>
          🖼️
        </button>
        <button title="Manage products" onClick={() => openDialog(cat.id)}>
          📦
        </button>
        <button title="Add child" onClick={() => create(cat.id)}>
          ➕
        </button>
        <button title="Rename" onClick={() => rename(cat)}>
          ✏️
        </button>
        <button title="Delete" onClick={() => remove(cat)}>
          🗑️
        </button>

        {open && cat.children?.length && (
          <ul className="ml-4 list-disc space-y-1">
            {cat.children.map((ch) => (
              <Node key={ch.id} cat={ch} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul className="list-disc space-y-1">
      {cats.map((c) => (
        <Node key={c.id} cat={c} />
      ))}
    </ul>
  );
}
