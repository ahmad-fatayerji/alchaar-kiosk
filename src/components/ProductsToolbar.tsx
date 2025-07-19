"use client";

import { Plus, Upload, FileDown, Trash2, FolderSymlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import { useRef } from "react";

type Props = {
  search: string;
  onSearch(v: string): void;
  onNew(): void;
  onBulk(files: FileList): void;
  onExport(): void;
  onBulkDelete(): void;
  onBulkAssignClick(): void;
  disabled?: boolean;
  selectedCount: number;
};

export default function ProductsToolbar({
  search,
  onSearch,
  onNew,
  onBulk,
  onExport,
  onBulkDelete,
  onBulkAssignClick,
  disabled,
  selectedCount,
}: Props) {
  const bulkRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <SearchBox
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-56"
      />

      <div className="flex flex-wrap gap-2">
        {/* bulk thumbnail upload */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => bulkRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Upload&nbsp;images
        </Button>
        <input
          ref={bulkRef}
          hidden
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files?.length) onBulk(e.target.files);
            e.target.value = "";
          }}
        />

        {/* export */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={disabled}
        >
          <FileDown className="mr-1.5 h-4 w-4" />
          Export
        </Button>

        {/* bulk delete */}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || selectedCount === 0}
          onClick={onBulkDelete}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete&nbsp;selected
        </Button>

        {/* bulk assign */}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || selectedCount === 0}
          onClick={onBulkAssignClick}
        >
          <FolderSymlink className="mr-1.5 h-4 w-4" />
          Move&nbsp;to&nbsp;category
        </Button>

        {/* new product */}
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>
    </div>
  );
}
