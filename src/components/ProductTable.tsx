"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import RowActions from "./RowActions";
import Thumb from "./Thumb";
import type { Product } from "./ProductDialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
type Props = {
  data: Product[];
  globalFilter: string;
  selected: Set<string>;
  /* ← accept either a Set *or* an updater fn */
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  onEdit(p: Product): void;
  onDelete(code: string): void;
  onUploaded(): void; // refresh after single-row thumb upload
  salesEnabled?: boolean; // whether sales features are enabled
  onAdjustStock?: (barcode: string, delta: number) => void;
};

/* ------------------------------------------------------------------ */
/* Column definitions                                                  */
/* ------------------------------------------------------------------ */
const buildColumns = (
  onEdit: Props["onEdit"],
  onDelete: Props["onDelete"],
  onUploaded: Props["onUploaded"],
  selected: Set<string>,
  toggleSel: (code: string, newSet?: Set<string>) => void,
  salesEnabled: boolean = true,
  onAdjustStock?: Props["onAdjustStock"]
): ColumnDef<Product>[] => [
  /* ---- selection checkbox ---- */
  {
    id: "select",
    enableSorting: false,
    size: 50,
    header: ({ table }) => {
      const allCodes = table.getRowModel().rows.map((r) => r.original.barcode);
      const allSelected = allCodes.every((c) => selected.has(c));
      return (
        <div className="flex justify-center p-2">
          <Checkbox
            checked={allSelected && allCodes.length > 0}
            onCheckedChange={() => {
              const set = new Set(selected);
              if (allSelected) allCodes.forEach((c) => set.delete(c));
              else allCodes.forEach((c) => set.add(c));
              toggleSel("___bulk", set);
            }}
          />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center p-2">
        <Checkbox
          checked={selected.has(row.original.barcode)}
          onCheckedChange={() => toggleSel(row.original.barcode)}
        />
      </div>
    ),
  },
  /* ---- thumbnail ---- */
  {
    id: "thumb",
    header: () => <span className="sr-only">Image</span>,
    enableSorting: false,
    size: 70,
    cell: ({ row }) => <Thumb code={row.original.barcode} />,
  },
  /* ---- barcode ---- */
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ getValue }) => (
      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
        {getValue() as string}
      </code>
    ),
  },
  /* ---- name ---- */
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row, getValue }) => {
      const archived = (row.original as any).archived;
      return (
        <div className="flex items-center gap-3 overflow-hidden">
          <span
            className={
              "font-medium truncate min-w-0 mr-3 " +
              (archived ? "text-gray-500" : "")
            }
          >
            {getValue() as string}
          </span>
          {archived && (
            <span
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
                borderRadius: "0.375rem",
                padding: "0.125rem 0.5rem",
                fontSize: "0.75rem",
                lineHeight: "1rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                marginLeft: "12px",
                flex: "none",
              }}
            >
              Archived
            </span>
          )}
        </div>
      );
    },
  },
  /* ---- category ---- */
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) =>
      typeof getValue() === "string" ? (
        <Badge variant="outline">{getValue() as string}</Badge>
      ) : (getValue() as any)?.name ? (
        <Badge variant="outline">{(getValue() as any).name}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  /* ---- price ---- */
  {
    accessorKey: "price",
    header: () => (
      <div className="flex items-center gap-2">
        Price
        {!salesEnabled && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Sales Disabled
          </span>
        )}
      </div>
    ),
    cell: ({ row }) => {
      const regularPrice = Number(row.original.price);
      const hasSale =
        salesEnabled &&
        row.original.salePrice &&
        Number(row.original.salePrice) > 0;
      const salePrice = hasSale ? Number(row.original.salePrice) : null;
      const isNA = !hasSale && regularPrice === 0;

      return (
        <div className="flex flex-col gap-1">
          {hasSale ? (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ${regularPrice.toFixed(2)}
              </span>
              <span className="font-medium text-green-600">
                ${salePrice!.toFixed(2)}
              </span>
            </>
          ) : isNA ? (
            <span className="font-medium text-muted-foreground">N/A</span>
          ) : (
            <span className="font-medium">${regularPrice.toFixed(2)}</span>
          )}
        </div>
      );
    },
  },
  /* ---- stock ---- */
  {
    accessorKey: "qtyInStock",
    header: "Stock",
    cell: ({ row, getValue }) => {
      const qty = getValue() as number;
      const archived = (row.original as any).archived;
      const code = String(row.original.barcode);
      return (
        <div className="flex items-center gap-1">
          {onAdjustStock && !archived && (
            <button
              type="button"
              onClick={() => onAdjustStock(code, -1)}
              className="size-6 rounded border border-input text-xs leading-none flex items-center justify-center hover:bg-accent"
              aria-label="Decrease stock"
            >
              −
            </button>
          )}
          <Badge
            variant={
              archived ? "secondary" : qty > 0 ? "default" : "destructive"
            }
            className={
              "font-mono min-w-6 text-center " + (archived ? "opacity-70" : "")
            }
          >
            {qty}
          </Badge>
          {onAdjustStock && !archived && (
            <button
              type="button"
              onClick={() => onAdjustStock(code, +1)}
              className="size-6 rounded border border-input text-xs leading-none flex items-center justify-center hover:bg-accent"
              aria-label="Increase stock"
            >
              +
            </button>
          )}
        </div>
      );
    },
  },
  /* ---- row actions ---- */
  {
    id: "actions",
    enableSorting: false,
    size: 60,
    cell: ({ row }) => (
      <RowActions
        code={row.original.barcode}
        onEdit={() => onEdit(row.original)}
        onDelete={() => onDelete(row.original.barcode)}
        onUploaded={onUploaded}
      />
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function ProductTable({
  data,
  globalFilter,
  selected,
  setSelected,
  onEdit,
  onDelete,
  onUploaded,
  salesEnabled = true,
  onAdjustStock,
}: Props) {
  /* helper to toggle selection */
  const toggleSel = React.useCallback(
    (code: string, newSet?: Set<string>) => {
      if (code === "___bulk" && newSet) {
        setSelected(newSet);
        return;
      }
      setSelected((s) => {
        const cp = new Set(s);
        cp.has(code) ? cp.delete(code) : cp.add(code);
        return cp;
      });
    },
    [setSelected]
  );

  /* react-table instance */
  const table = useReactTable({
    data,
    columns: React.useMemo(
      () =>
        buildColumns(
          onEdit,
          onDelete,
          onUploaded,
          selected,
          toggleSel,
          salesEnabled,
          onAdjustStock
        ),
      [
        onEdit,
        onDelete,
        onUploaded,
        selected,
        toggleSel,
        salesEnabled,
        onAdjustStock,
      ]
    ),
    state: { globalFilter },
    onGlobalFilterChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  /* render */
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/50">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="whitespace-nowrap font-semibold"
                >
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const archived = (row.original as any).archived;
            return (
              <TableRow
                key={row.id}
                className={
                  "hover:bg-muted/30 " + (archived ? "bg-gray-50/70" : "")
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
