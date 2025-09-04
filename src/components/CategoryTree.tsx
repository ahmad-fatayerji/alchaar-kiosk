"use client";

import { useState, useCallback, memo, useRef } from "react";
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
  dragState: {
    draggingId: number | null;
    draggingParentId: number | null;
    overId: number | null;
    overParentId: number | null;
    before: boolean;
  };
  toggle(cat: Category): void;
  beginDrag(id: number, parentId: number | null): void;
  overDrag(
    id: number | null,
    parentId: number | null,
    y: number,
    element: HTMLLIElement
  ): void;
  finalize(): void;
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
    dragState,
    toggle,
    create,
    rename,
    remove,
    openDialog,
    uploadThumb,
    beginDrag,
    overDrag,
    finalize,
  }: RowProps) {
    const isOpen = openIds.has(cat.id);
    const isLoading = busyIds.has(cat.id);
    const hasArrow =
      cat.hasChildren !== false &&
      (cat.children === undefined || cat.children.length > 0);

    const liRef = useRef<HTMLLIElement | null>(null);

    const highlight =
      dragState.draggingId !== null && dragState.overId === cat.id;

    return (
      <li
        ref={liRef}
        className={cn(
          "relative group",
          highlight && "ring-2 ring-primary/60 rounded-md"
        )}
        data-cat-id={cat.id}
        onDragOver={(e) => {
          if (!liRef.current) return;
          e.preventDefault();
          overDrag(cat.id, cat.parentId, e.clientY, liRef.current);
        }}
        onDragEnter={(e) => {
          if (!liRef.current) return;
          e.preventDefault();
          overDrag(cat.id, cat.parentId, e.clientY, liRef.current);
        }}
      >
        {/* vertical guideline */}
        {depth > 0 && (
          <>
            <span className="absolute left-0 top-0 h-full w-px bg-border/50" />
            <span className="absolute left-0 top-6 w-6 border-t border-border/50" />
          </>
        )}

        <div
          className={cn(
            "flex items-center gap-3 pl-6 py-2 rounded-lg hover:bg-accent/50 transition-colors",
            highlight && "bg-accent/70"
          )}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            beginDrag(cat.id, cat.parentId);
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDragEnd={() => {
            // safety reset if drop event not fired (e.g., drag cancelled)
            finalize();
          }}
        >
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

          {/* drag handle / thumbnail + name */}
          <span className="cursor-grab active:cursor-grabbing select-none text-muted-foreground">
            ⋮⋮
          </span>
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
            onDragOver={(e) => {
              if (dragState.draggingId == null) return;
              if (e.target !== e.currentTarget) return;
              e.preventDefault();
              overDrag(
                null,
                cat.id,
                e.clientY,
                (liRef.current || e.currentTarget) as HTMLLIElement
              );
            }}
          >
            {cat.children.map((ch) => (
              <Row
                key={ch.id}
                cat={ch}
                depth={depth + 1}
                openIds={openIds}
                busyIds={busyIds}
                dragState={dragState}
                toggle={toggle}
                beginDrag={beginDrag}
                overDrag={overDrag}
                finalize={finalize}
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
  reorder(parentId: number | null, orderedIds: number[]): Promise<void>;
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
  reorder,
}: Props) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [dragState, setDragState] = useState<{
    draggingId: number | null;
    draggingParentId: number | null;
    overId: number | null;
    overParentId: number | null;
    before: boolean;
  }>({
    draggingId: null,
    draggingParentId: null,
    overId: null,
    overParentId: null,
    before: true,
  });

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

  const beginDrag = useCallback((id: number, parentId: number | null) => {
    setDragState({
      draggingId: id,
      draggingParentId: parentId,
      overId: null,
      overParentId: parentId,
      before: true,
    });
  }, []);

  const overDrag = useCallback(
    (
      overId: number | null,
      overParentId: number | null,
      clientY: number,
      el: HTMLLIElement
    ) => {
      setDragState((s) => {
        if (s.draggingId == null) return s;
        // only allow within same parent
        if (overParentId !== s.draggingParentId) return s;
        const rect = el.getBoundingClientRect();
        const before = clientY < rect.top + rect.height / 2;
        return { ...s, overId: overId, overParentId, before };
      });
    },
    []
  );

  const finalize = useCallback(() => {
    setDragState((s) => {
      if (s.draggingId == null) return s;
      const { draggingId, draggingParentId, overId, overParentId, before } = s;
      // compute outside then reorder
      const list =
        overParentId === draggingParentId
          ? draggingParentId == null
            ? cats
            : findNode(cats, draggingParentId)?.children
          : null;
      if (!list)
        return {
          draggingId: null,
          draggingParentId: null,
          overId: null,
          overParentId: null,
          before: true,
        };
      const ids = list.map((c) => c.id);
      const fromIdx = ids.indexOf(draggingId);
      if (fromIdx !== -1) {
        let toIdx: number;
        if (overId == null) {
          toIdx = ids.length - 1;
        } else {
          const base = ids.indexOf(overId);
          toIdx = base + (before ? 0 : 1);
        }
        if (toIdx > fromIdx) toIdx -= 1;
        if (toIdx < 0) toIdx = 0;
        if (toIdx > ids.length - 1) toIdx = ids.length - 1;
        const newIds = [...ids];
        const [m] = newIds.splice(fromIdx, 1);
        newIds.splice(toIdx, 0, m);
        if (ids.some((id, i) => id !== newIds[i])) {
          if (process.env.NODE_ENV !== "production")
            console.log("[CAT-DRAG-FINAL]", {
              draggingId,
              parent: draggingParentId,
              fromIdx,
              toIdx,
              ids,
              newIds,
            });
          // defer reorder with microtask to avoid setState in render warning
          queueMicrotask(() => reorder(draggingParentId, newIds));
        }
      }
      return {
        draggingId: null,
        draggingParentId: null,
        overId: null,
        overParentId: null,
        before: true,
      };
    });
  }, [cats, reorder]);

  // dropOnParent removed; finalize handles reorder on dragEnd

  function findNode(list: Category[], id: number): Category | undefined {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.children) {
        const f = findNode(c.children, id);
        if (f) return f;
      }
    }
    return undefined;
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <ul
        className="space-y-1 list-none"
        onDragOver={(e) => {
          if (dragState.draggingId == null) return;
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          overDrag(
            null,
            null,
            e.clientY,
            e.currentTarget as unknown as HTMLLIElement
          );
        }}
        onDragEnd={() => finalize()}
      >
        {cats.map((c) => (
          <Row
            key={c.id}
            cat={c}
            depth={0}
            openIds={openIds}
            busyIds={busy}
            dragState={dragState}
            toggle={toggle}
            beginDrag={beginDrag}
            overDrag={overDrag}
            finalize={finalize}
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
