"use client";

import {
  Plus,
  Upload,
  FileDown,
  Trash2,
  FolderSymlink,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  search: string;
  onSearch(v: string): void;
  onNew(): void;
  onBulk(files: FileList): void;
  onExport(): void;
  onBulkDelete(): void;
  onBulkAssignClick(): void;
  onBulkSaleClick(): void;
  disabled?: boolean;
  selectedCount: number;
  showArchived: boolean;
  onToggleArchived(v: boolean): void;
};

export default function ProductsToolbar({
  search,
  onSearch,
  onNew,
  onBulk,
  onExport,
  onBulkDelete,
  onBulkAssignClick,
  onBulkSaleClick,
  disabled,
  selectedCount,
  showArchived,
  onToggleArchived,
}: Props) {
  const bulkRef = useRef<HTMLInputElement>(null);
  const [salesEnabled, setSalesEnabled] = useState(true);

  // Load sales enabled setting
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        setSalesEnabled(settings.sales_enabled !== "false");
      })
      .catch(() => {
        setSalesEnabled(true); // Default to enabled if can't load
      });
  }, []);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
      <SearchBox
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-64"
      />

      <div className="flex items-center gap-3">
        {/* show archived toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-700 mr-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleArchived(e.target.checked)}
          />
          Show archived
        </label>
        {selectedCount > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} selected
          </Badge>
        )}

        {/* bulk thumbnail upload */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => bulkRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Upload Images
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
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete Selected
        </Button>

        {/* bulk assign */}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || selectedCount === 0}
          onClick={onBulkAssignClick}
        >
          <FolderSymlink className="mr-1.5 h-4 w-4" />
          Move to Category
        </Button>

        {/* bulk sale */}
        {salesEnabled ? (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || selectedCount === 0}
            onClick={onBulkSaleClick}
            className="text-orange-600 hover:bg-orange-50"
          >
            <Tag className="mr-1.5 h-4 w-4" />
            Manage Sales
          </Button>
        ) : (
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled={true}
              className="text-gray-400 cursor-not-allowed"
            >
              <Tag className="mr-1.5 h-4 w-4" />
              Manage Sales
            </Button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Sales features are disabled in Settings
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        )}

        {/* new product */}
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Product
        </Button>
      </div>
    </div>
  );
}
