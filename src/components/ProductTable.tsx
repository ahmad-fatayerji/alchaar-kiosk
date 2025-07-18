"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender, // ⬅️  NEW
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
import type { Product } from "./ProductDialog";

type Props = {
  data: Product[];
  globalFilter: string;
  onEdit(p: Product): void;
  onDelete(code: string): void;
  onUploaded(): void;
};

/* ---------- column defs ---------- */
const buildColumns = (
  onEdit: Props["onEdit"],
  onDelete: Props["onDelete"],
  onUploaded: Props["onUploaded"]
): ColumnDef<Product>[] => [
  {
    accessorKey: "barcode",
    header: "Barcode",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
  },
  {
    id: "thumbnail",
    header: "Thumbnail",
    enableSorting: false,
    cell: ({ row }) => {
      const [src, setSrc] = React.useState<string>(
        `/products/${row.original.barcode}.jpg`
      );

      return (
        <img
          src={src}
          alt="thumb"
          className="h-16 w-16 rounded border object-contain"
          onError={() => {
            if (src.endsWith(".jpg")) {
              setSrc(`/products/${row.original.barcode}.png`);
            }
          }}
        />
      );
    },
  },
  {
    id: "actions",
    enableSorting: false,
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

export default function ProductTable({
  data,
  globalFilter,
  onEdit,
  onDelete,
  onUploaded,
}: Props) {
  /* ---------- react-table setup ---------- */
  const columns = React.useMemo(
    () => buildColumns(onEdit, onDelete, onUploaded),
    [onEdit, onDelete, onUploaded]
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  });

  /* ---------- render ---------- */
  return (
    <Table>
      {/* table header */}
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

      {/* table body */}
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
