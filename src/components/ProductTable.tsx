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

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
type Props = {
  data: Product[];
  globalFilter: string;
  onEdit(p: Product): void;
  onDelete(code: string): void;
  onUploaded(): void; // refresh after single-row thumb upload
};

/* ------------------------------------------------------------------ */
/* Column definitions                                                  */
/* ------------------------------------------------------------------ */
const buildColumns = (
  onEdit: Props["onEdit"],
  onDelete: Props["onDelete"],
  onUploaded: Props["onUploaded"]
): ColumnDef<Product>[] => [
  /* ---- thumbnail (fixed size) ---- */
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
  },
  /* ---- name ---- */
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue() as string}</span>
    ),
  },
  /* ---- category ---- */
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) =>
      // react-table flattens dot-accessors, we stored full object earlier
      typeof getValue() === "string"
        ? (getValue() as string)
        : (getValue() as any)?.name ?? "",
  },
  /* ---- price ---- */
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
  },
  /* ---- stock ---- */
  {
    accessorKey: "qtyInStock",
    header: "Stock",
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
  onEdit,
  onDelete,
  onUploaded,
}: Props) {
  /* react-table instance */
  const table = useReactTable({
    data,
    columns: React.useMemo(
      () => buildColumns(onEdit, onDelete, onUploaded),
      [onEdit, onDelete, onUploaded]
    ),
    state: { globalFilter },
    onGlobalFilterChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  /* render */
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="whitespace-nowrap">
                {h.isPlaceholder
                  ? null
                  : flexRender(h.column.columnDef.header, h.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="align-middle">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
