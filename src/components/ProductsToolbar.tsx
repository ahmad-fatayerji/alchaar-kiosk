"use client";

import {
  Plus,
  Upload,
  FileDown,
  Trash2,
  FolderSymlink,
  Tag,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMessages } from "@/contexts/MessageContext";
import type { Category } from "./ProductDialog";

type Props = {
  search: string;
  onSearch(v: string): void;
  sortBy: "name-asc" | "name-desc";
  onSortByChange(v: "name-asc" | "name-desc"): void;
  categoryFilter: string;
  onCategoryFilterChange(v: string): void;
  categories: Category[];
  onNew(): void;
  onBulk(files: FileList): void;
  onExport(): void;
  onImported?(): void; // optional refresh callback after import
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
  sortBy,
  onSortByChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
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
  onImported,
}: Props) {
  const bulkRef = useRef<HTMLInputElement>(null);
  const [salesEnabled, setSalesEnabled] = useState(true);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [initialSummary, setInitialSummary] = useState<any | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [conflictSelections, setConflictSelections] = useState<
    Record<string, boolean>
  >({});
  const [conflictOpen, setConflictOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const { notify } = useMessages();

  async function runImport(
    file: File,
    updateNames: string[] = [],
    mergeWithInitial = false
  ) {
    const fd = new FormData();
    fd.append("file", file);
    if (updateNames.length) fd.append("updateNames", updateNames.join(","));
    setImporting(true);
    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        notify({
          message: `Import failed (${res.status}): ${j.error || "unknown error"}`,
          variant: "error",
        });
        return;
      }
      const summary = await res.json();
      if (mergeWithInitial && initialSummary) {
        const merged = {
          ...initialSummary,
          updatedNames: summary.updatedNames,
          nameDifferences: summary.nameDifferences,
        };
        setImportSummary(merged);
        setImportOpen(true);
        setInitialSummary(null);
        setConflicts([]);
        setConflictSelections({});
      } else if (summary.nameDifferences?.length) {
        setInitialSummary(summary);
        setConflicts(summary.nameDifferences);
        const sel: Record<string, boolean> = {};
        summary.nameDifferences.forEach((c: any) => (sel[c.barcode] = false));
        setConflictSelections(sel);
        setConflictOpen(true);
      } else {
        setImportSummary(summary);
        setImportOpen(true);
      }
      onImported?.();
    } finally {
      setImporting(false);
    }
  }

  function downloadReport() {
    if (!importSummary) return;
    const blob = new Blob([JSON.stringify(importSummary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-report.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

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
    <div className="products-toolbar mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-64"
        />
        <Select
          value={sortBy}
          onValueChange={(value) =>
            onSortByChange(value as "name-asc" | "name-desc")
          }
        >
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={onCategoryFilterChange}
          onOpenChange={(open) => {
            if (!open) setCategorySearch("");
          }}
        >
          <SelectTrigger className="h-8 w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-1">
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search categories..."
                className="h-8"
              />
            </div>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="none">Uncategorized</SelectItem>
            {categories
              .filter((cat) =>
                cat.name
                  .toLowerCase()
                  .includes(categorySearch.trim().toLowerCase())
              )
              .map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        {/* show archived toggle */}
        <div className="flex items-center gap-2 mr-2">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(v) => onToggleArchived(Boolean(v))}
          />
          <label
            htmlFor="show-archived"
            className="text-sm text-muted-foreground select-none"
          >
            Show archived
          </label>
        </div>
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

        {/* import */}
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setPendingFile(f);
                await runImport(f);
              } finally {
                e.target.value = "";
              }
            }}
          />
          <Button variant="outline" size="sm" disabled={disabled} asChild>
            <span>
              <FileUp className="mr-1.5 h-4 w-4" /> Import
            </span>
          </Button>
        </div>

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

      {/* Import Report Dialog */}
      <Dialog open={importOpen} onOpenChange={(o) => setImportOpen(o)}>
        <DialogContent className="max-w-3xl w-full max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Report</DialogTitle>
          </DialogHeader>
          {importSummary && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-xs uppercase font-medium text-green-700">
                    Created
                  </div>
                  <div className="text-lg font-semibold text-green-800">
                    {importSummary.created}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-xs uppercase font-medium text-blue-700">
                    Updated
                  </div>
                  <div className="text-lg font-semibold text-blue-800">
                    {importSummary.updated}
                  </div>
                </div>
                {typeof importSummary.updatedNames === "number" && (
                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                    <div className="text-xs uppercase font-medium text-violet-700">
                      Renamed
                    </div>
                    <div className="text-lg font-semibold text-violet-800">
                      {importSummary.updatedNames}
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xs uppercase font-medium text-amber-700">
                    Skipped
                  </div>
                  <div className="text-lg font-semibold text-amber-800">
                    {importSummary.skipped?.length || 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="text-xs uppercase font-medium text-red-700">
                    Errors
                  </div>
                  <div className="text-lg font-semibold text-red-800">
                    {importSummary.errors?.length || 0}
                  </div>
                </div>
              </div>

              {importSummary.nameDifferences?.length > 0 && (
                <div>
                  <h3 className="font-semibold mt-4 mb-2 text-sm text-violet-700">
                    Not Renamed ({importSummary.nameDifferences.length})
                  </h3>
                  <ul className="space-y-1 text-xs bg-violet-50 border border-violet-100 rounded p-3 max-h-40 overflow-auto">
                    {importSummary.nameDifferences.map((c: any) => (
                      <li key={c.barcode}>
                        <span className="font-mono">{c.barcode}</span>: "
                        {c.existingName}" →{" "}
                        <span className="line-through decoration-violet-500/60">
                          {c.newName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importSummary.errors?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-700 flex items-center">
                    Errors
                  </h3>
                  <ul className="space-y-1 text-sm bg-red-50 border border-red-100 rounded p-3 max-h-56 overflow-auto">
                    {importSummary.errors.map((e: any, idx: number) => (
                      <li key={idx} className="whitespace-pre-wrap">
                        Row {e.row}
                        {e.barcode ? ` (${e.barcode})` : ""}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importSummary.skipped?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-amber-700">Skipped</h3>
                  <ul className="space-y-1 text-sm bg-amber-50 border border-amber-100 rounded p-3 max-h-56 overflow-auto">
                    {importSummary.skipped.map((s: any, idx: number) => (
                      <li key={idx}>
                        Row {s.row}
                        {s.barcode ? ` (${s.barcode})` : ""}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={downloadReport}
              disabled={!importSummary}
            >
              Download JSON
            </Button>
            <Button onClick={() => setImportOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Name Conflict Dialog */}
      <Dialog
        open={conflictOpen}
        onOpenChange={(o) => {
          if (!o) setConflictOpen(false);
        }}
      >
        <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Product Name Differences</DialogTitle>
          </DialogHeader>
          {conflicts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No conflicts.</div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                Choose which existing products to rename to the new name from
                the file.
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConflictSelections(
                      Object.fromEntries(
                        conflicts.map((c) => [c.barcode, true])
                      )
                    )
                  }
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConflictSelections(
                      Object.fromEntries(
                        conflicts.map((c) => [c.barcode, false])
                      )
                    )
                  }
                >
                  None
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setImportSummary(initialSummary);
                    setImportOpen(true);
                    setConflictOpen(false);
                    setInitialSummary(null);
                  }}
                >
                  Skip Renames
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-left sticky top-0">
                    <tr>
                      <th className="p-2 w-16">Rename</th>
                      <th className="p-2">Barcode</th>
                      <th className="p-2">Current</th>
                      <th className="p-2">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.map((c) => (
                      <tr key={c.barcode} className="border-t">
                        <td className="p-2 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!conflictSelections[c.barcode]}
                            onChange={(ev) =>
                              setConflictSelections({
                                ...conflictSelections,
                                [c.barcode]: ev.target.checked,
                              })
                            }
                          />
                        </td>
                        <td className="p-2 font-mono align-top">{c.barcode}</td>
                        <td className="p-2 align-top text-red-700">
                          {c.existingName}
                        </td>
                        <td className="p-2 align-top text-green-700">
                          {c.newName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConflictOpen(false);
                setInitialSummary(null);
                setConflicts([]);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={importing || conflicts.length === 0}
              onClick={async () => {
                if (!pendingFile) return;
                const chosen = conflicts
                  .filter((c) => conflictSelections[c.barcode])
                  .map((c) => c.barcode);
                setConflictOpen(false);
                await runImport(pendingFile, chosen, true);
              }}
            >
              {importing ? "Applying..." : "Apply Selected Renames"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
