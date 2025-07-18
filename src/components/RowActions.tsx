"use client";

import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

type Props = {
  code: string; // product barcode
  onEdit(): void;
  onDelete(): void;
  onUploaded(): void; // parent refresh
};

export default function RowActions({
  code,
  onEdit,
  onDelete,
  onUploaded,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---- single-file thumbnail upload ---- */
  async function handleSingleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    await fetch(`/api/products/${code}/thumbnail`, {
      method: "POST",
      body: fd,
    });

    onUploaded(); // let parent refresh list
    e.target.value = ""; // allow the same file to be chosen again later
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded p-1 hover:bg-muted">
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>

          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            Upload&nbsp;thumb
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-red-600 focus:bg-red-50"
            onClick={onDelete}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* hidden file input (single image) */}
      <input
        ref={fileRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleSingleUpload}
      />
    </>
  );
}
