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
import { MoreHorizontal, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      <li className="relative group">
        {/* vertical guideline */}
        {depth > 0 && (
          <>
            <span className="absolute left-0 top-0 h-full w-px bg-border/50" />
            <span className="absolute left-0 top-6 w-6 border-t border-border/50" />
          </>
        )}

        <div className="flex items-center gap-3 pl-6 py-2 rounded-lg hover:bg-accent/50 transition-colors">
          {/* arrow / spinner / placeholder */}
          {hasArrow ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
              onClick={() => toggle(cat)}
            >
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <span className="w-6" />
          )}

          {/* thumbnail + name */}
          <CatThumb id={cat.id} size={32} />
          <span className="font-medium text-foreground flex-1">{cat.name}</span>

          {/* actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
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
              "pl-6 space-y-1 list-none mt-1",
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
    <div className="bg-card rounded-lg border border-border p-4">
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
    </div>
  );
}
