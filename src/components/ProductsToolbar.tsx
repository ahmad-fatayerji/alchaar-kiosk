"use client";

import { Plus, Upload, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import { useRef } from "react";

type Props = {
  search: string;
  onSearch(v: string): void;
  onNew(): void;
  onBulk(files: FileList): void;
  onExport(): void;
  disabled?: boolean;
};

/** Top toolbar for the Products panel (search + buttons). */
export default function ProductsToolbar({
  search,
  onSearch,
  onNew,
  onBulk,
  onExport,
  disabled,
}: Props) {
  const bulkRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <SearchBox
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-56"
      />

      <div className="flex gap-2">
        {/* bulk upload */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => bulkRef.current?.click()}
          disabled={disabled}
          title="Upload multiple images at once"
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
          title="Download products.xlsx"
        >
          <FileDown className="mr-1.5 h-4 w-4" />
          Export
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
