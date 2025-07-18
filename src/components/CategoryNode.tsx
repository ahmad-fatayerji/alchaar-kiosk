"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import CatThumb from "./CatThumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/hooks/useCategories";

type NodeProps = {
  cat: Category;
  depth: number;
  open: boolean;
  loading: boolean;
  toggle(cat: Category): void;

  /* actions passed straight through */
  create(parentId: number | null): void;
  rename(cat: Category): void;
  remove(cat: Category): void;
  openDialog(catId: number): void;
  uploadThumb(catId: number): void;
};

function NodeImpl({
  cat,
  depth,
  open,
  loading,
  toggle,
  create,
  rename,
  remove,
  openDialog,
  uploadThumb,
}: NodeProps) {
  const hasArrow =
    cat.hasChildren !== false &&
    (cat.children === undefined || cat.children.length > 0);

  return (
    <li className="relative">
      {depth > 0 && (
        <span className="absolute left-0 top-0 h-full w-px bg-border" />
      )}

      <div className="flex items-center gap-2 pl-6 relative">
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
    </li>
  );
}

/*  🔒  never re-render unless *cat.id* or props *really* changed  */
export default React.memo(NodeImpl);
