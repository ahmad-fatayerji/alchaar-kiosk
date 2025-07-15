"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
  onEdit(p: Product): void;
  onDelete(code: string): void;
};

export default function ProductTable({ data, onEdit, onDelete }: Props) {
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
    { accessorKey: "categoryId", header: "Category" }, // You can replace with join if needed
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
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
  );
}
