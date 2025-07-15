"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { Badge } from "@/components/ui/badge";
import Thumb from "./Thumb";
import RowActions from "./RowActions";
import type { Product } from "./ProductDialog";

type Props = {
  data: Product[];
  globalFilter: string;
  onEdit(p: Product): void;
  onDelete(code: string): void;
};

export default function ProductTable({
  data,
  globalFilter,
  onEdit,
  onDelete,
}: Props) {
  const cols: ColumnDef<Product>[] = [
    {
      id: "thumb",
      header: "",
      enableSorting: false,
      size: 56,
      cell: ({ row }) => <Thumb code={row.original.barcode} />,
    },
    { accessorKey: "barcode", header: "Barcode" },
    { accessorKey: "name", header: "Name" },
    {
      header: "Category",
      accessorFn: (row) => (row as any).category?.name ?? "—",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => `$${getValue()}`,
    },
    {
      accessorKey: "qtyInStock",
      header: "Stock",
      cell: ({ getValue }) =>
        Number(getValue()) > 0 ? (
          getValue()
        ) : (
          <Badge variant="destructive">0</Badge>
        ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original.barcode)}
        />
      ),
    },
  ];

  const table = useReactTable({
    columns: cols,
    data,
    state: { globalFilter },
    globalFilterFn: (row, _columnId, v) => {
      const val = v.toString().toLowerCase();
      return (
        row.original.name.toLowerCase().includes(val) ||
        row.original.barcode.includes(val) ||
        (row.original as any).category?.name?.toLowerCase().includes(val)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* pagination controls */}
      <div className="mt-2 flex items-center justify-end gap-4 text-sm">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ‹
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          ›
        </button>
      </div>
    </>
  );
}
