"use client";

import { useState } from "react";
import type { Category } from "@/hooks/useCategories";
import CatThumb from "./CatThumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

type Props = {
  cats: Category[];
  busy: Set<number>;
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

  /* ─── toggle + lazy children ───────────────────────────────────── */
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

  /* ─── single node ──────────────────────────────────────────────── */
  const Node = ({ cat, depth }: { cat: Category; depth: number }) => {
    const open = openIds.has(cat.id);
    const loading = busy.has(cat.id);

    const hasArrow =
      cat.hasChildren !== false &&
      (cat.children === undefined || (cat.children?.length ?? 0) > 0);

    return (
      <li className="relative">
        {/* vertical line for all children below this node */}
        {depth > 0 && (
          <span className="absolute left-0 top-0 h-full w-px bg-border" />
        )}

        {/* row */}
        <div className="flex items-center gap-2 pl-6 relative">
          {/* horizontal connector */}
          {depth > 0 && (
            <span className="absolute left-0 top-4 w-6 border-t bg-transparent border-border" />
          )}

          {hasArrow ? (
            <button
              className="w-4 text-xs text-gray-500"
              disabled={loading}
              onClick={() => toggle(cat)}
            >
              {loading ? "⏳" : open ? "▼" : "▶"}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <CatThumb id={cat.id} size={28} />
          <span>{cat.name}</span>

          {/* actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted/50">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => uploadThumb(cat.id)}>
                Upload image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog(cat.id)}>
                Manage products
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => create(cat.id)}>
                Add sub-category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => rename(cat)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => remove(cat)}
                className="text-destructive focus:bg-destructive/10"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* children list */}
        {open && cat.children?.length ? (
          <ul className="pl-6 space-y-1">
            {cat.children.map((ch) => (
              <Node key={ch.id} cat={ch} depth={depth + 1} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  };

  /* ─── root list ────────────────────────────────────────────────── */
  return (
    <ul className="space-y-1">
      {cats.map((c) => (
        <Node key={c.id} cat={c} depth={0} />
      ))}
    </ul>
  );
}
