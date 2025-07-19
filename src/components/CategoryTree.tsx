"use client";

import { useState, useCallback, memo } from "react";
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
import { cn } from "@/lib/utils";

/* -------------------------------------------------- */
/* Row (memoised)                                     */
/* -------------------------------------------------- */
type RowProps = {
  cat: Category;
  depth: number;
  openIds: Set<number>;
  busyIds: Set<number>;
  toggle(cat: Category): void;
  /* actions */
  create(parentId: number | null): void;
  rename(cat: Category): void;
  remove(cat: Category): void;
  openDialog(catId: number): void;
  uploadThumb(catId: number): void;
};

const Row = memo(
  function Row({
    cat,
    depth,
    openIds,
    busyIds,
    toggle,
    create,
    rename,
    remove,
    openDialog,
    uploadThumb,
  }: RowProps) {
    const isOpen = openIds.has(cat.id);
    const isLoading = busyIds.has(cat.id);
    const hasArrow =
      cat.hasChildren !== false &&
      (cat.children === undefined || cat.children.length > 0);

    return (
      <li className="relative">
        {/* vertical guideline */}
        {depth > 0 && (
          <>
            <span className="absolute left-0 top-0 h-full w-px bg-border" />
            <span className="absolute left-0 top-4 w-6 border-t border-border" />
          </>
        )}

        <div className="flex items-center gap-2 pl-6">
          {/* arrow / spinner / placeholder */}
          {hasArrow ? (
            <button
              className="w-4 text-xs text-gray-500"
              disabled={isLoading}
              onClick={() => toggle(cat)}
            >
              {isLoading ? "⏳" : isOpen ? "▼" : "▶"}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* thumbnail + name */}
          <CatThumb id={cat.id} size={28} />
          <span>{cat.name}</span>

          {/* actions dropdown */}
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

        {/* children stay mounted – just hidden */}
        {cat.children && (
          <ul
            className={cn(
              "pl-6 space-y-1 list-none",
              !isOpen && "hidden" // toggle visibility only
            )}
          >
            {cat.children.map((ch) => (
              <Row
                key={ch.id}
                cat={ch}
                depth={depth + 1}
                openIds={openIds}
                busyIds={busyIds}
                toggle={toggle}
                create={create}
                rename={rename}
                remove={remove}
                openDialog={openDialog}
                uploadThumb={uploadThumb}
              />
            ))}
          </ul>
        )}
      </li>
    );
  },
  /* re-render only if these primitives change */
  (prev, next) =>
    prev.openIds === next.openIds && // same Set instance means same open state
    prev.busyIds === next.busyIds &&
    prev.cat === next.cat
);

/* -------------------------------------------------- */
/* Main tree component                                */
/* -------------------------------------------------- */
type Props = {
  cats: Category[];
  busy: Set<number>;
  ensure(cat: Category): Promise<void>;
} & Omit<RowProps, "cat" | "depth" | "openIds" | "busyIds" | "toggle">;

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
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const toggle = useCallback(
    async (cat: Category) => {
      if (openIds.has(cat.id)) {
        setOpenIds((s) => {
          const cp = new Set(s);
          cp.delete(cat.id);
          return cp;
        });
      } else {
        await ensure(cat); // lazy-load children first
        setOpenIds((s) => new Set(s).add(cat.id));
      }
    },
    [openIds, ensure]
  );

  return (
    <ul className="space-y-1 list-none">
      {cats.map((c) => (
        <Row
          key={c.id}
          cat={c}
          depth={0}
          openIds={openIds}
          busyIds={busy}
          toggle={toggle}
          create={create}
          rename={rename}
          remove={remove}
          openDialog={openDialog}
          uploadThumb={uploadThumb}
        />
      ))}
    </ul>
  );
}
