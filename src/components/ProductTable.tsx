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
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import RowActions from "./RowActions";
import Thumb from "./Thumb";
import type { Product, Category } from "./ProductDialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  data: Product[];
  globalFilter: string;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  onEdit(p: Product): void;
  onDelete(code: string): void;
  onUploaded(): void;
  salesEnabled?: boolean;
  onAdjustStock?: (barcode: string, delta: number) => void;
  categories: Category[];
  nameSort: "none" | "asc" | "desc";
  onNameSortChange: (value: "none" | "asc" | "desc") => void;
  priceSort: "none" | "asc" | "desc";
  onPriceSortChange: (value: "none" | "asc" | "desc") => void;
  stockSort: "none" | "asc" | "desc";
  onStockSortChange: (value: "none" | "asc" | "desc") => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  stockMin: string;
  stockMax: string;
  onStockMinChange: (value: string) => void;
  onStockMaxChange: (value: string) => void;
};

function HeaderButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={
        "-ml-2 h-8 px-2 text-sm font-semibold " +
        (active ? "text-foreground" : "text-muted-foreground")
      }
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function CategoryFilterHeader({
  categoryFilter,
  onCategoryFilterChange,
  categories,
}: {
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: Category[];
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filteredCategories = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, query]);

  const active = categoryFilter !== "all";

  return (
    <>
      <HeaderButton active={active} onClick={() => setOpen(true)}>
        Category
        <ChevronDown className="h-4 w-4" />
      </HeaderButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by Category</DialogTitle>
          </DialogHeader>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            className="mb-3"
          />
          <div className="max-h-80 overflow-y-auto space-y-1">
            <Button
              type="button"
              variant={categoryFilter === "all" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onCategoryFilterChange("all");
                setOpen(false);
              }}
            >
              All Categories
            </Button>
            <Button
              type="button"
              variant={categoryFilter === "none" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onCategoryFilterChange("none");
                setOpen(false);
              }}
            >
              Uncategorized
            </Button>
            {filteredCategories.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={
                  categoryFilter === String(cat.id) ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                onClick={() => {
                  onCategoryFilterChange(String(cat.id));
                  setOpen(false);
                }}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RangeFilterHeader({
  label,
  sort,
  onSortChange,
  min,
  max,
  onMinChange,
  onMaxChange,
  step,
}: {
  label: string;
  sort: "none" | "asc" | "desc";
  onSortChange: (value: "none" | "asc" | "desc") => void;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  step: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draftMin, setDraftMin] = React.useState(min);
  const [draftMax, setDraftMax] = React.useState(max);
  const active = min.trim() !== "" || max.trim() !== "";
  const nextSort = sort === "asc" ? "desc" : sort === "desc" ? "none" : "asc";

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftMin(min);
      setDraftMax(max);
      setOpen(true);
      return;
    }
    onMinChange(draftMin);
    onMaxChange(draftMax);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <HeaderButton active={sort !== "none"} onClick={() => onSortChange(nextSort)}>
        {label}
        {sort === "asc" ? (
          <ArrowUpAZ className="h-4 w-4" />
        ) : sort === "desc" ? (
          <ArrowDownAZ className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </HeaderButton>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          "h-8 px-2 " + (active ? "text-foreground" : "text-muted-foreground")
        }
        onClick={() => handleOpenChange(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{label} Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Min</div>
              <Input
                type="number"
                step={step}
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Max</div>
              <Input
                type="number"
                step={step}
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftMin("");
                  setDraftMax("");
                  handleOpenChange(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const buildColumns = (
  onEdit: Props["onEdit"],
  onDelete: Props["onDelete"],
  onUploaded: Props["onUploaded"],
  selected: Set<string>,
  toggleSel: (code: string, newSet?: Set<string>) => void,
  onAdjustStock: Props["onAdjustStock"],
  categories: Category[],
  nameSort: Props["nameSort"],
  onNameSortChange: Props["onNameSortChange"],
  priceSort: Props["priceSort"],
  onPriceSortChange: Props["onPriceSortChange"],
  stockSort: Props["stockSort"],
  onStockSortChange: Props["onStockSortChange"],
  categoryFilter: string,
  onCategoryFilterChange: Props["onCategoryFilterChange"],
  priceMin: string,
  priceMax: string,
  onPriceMinChange: Props["onPriceMinChange"],
  onPriceMaxChange: Props["onPriceMaxChange"],
  stockMin: string,
  stockMax: string,
  onStockMinChange: Props["onStockMinChange"],
  onStockMaxChange: Props["onStockMaxChange"]
): ColumnDef<Product>[] => [
  {
    id: "select",
    enableSorting: false,
    size: 50,
    header: ({ table }) => {
      const allCodes = table.getRowModel().rows.map((r) => r.original.barcode);
      const allSelected =
        allCodes.length > 0 && allCodes.every((c) => selected.has(c));
      return (
        <div className="flex justify-center p-2">
          <Checkbox
            checked={allSelected}
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
  {
    id: "thumb",
    header: () => <span className="sr-only">Image</span>,
    enableSorting: false,
    size: 70,
    cell: ({ row }) => <Thumb code={row.original.barcode} />,
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ getValue }) => (
      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
        {getValue() as string}
      </code>
    ),
  },
  {
    accessorKey: "name",
    header: () => {
      const nextState =
        nameSort === "asc" ? "desc" : nameSort === "desc" ? "none" : "asc";
      return (
        <HeaderButton
          active={nameSort !== "none"}
          onClick={() => onNameSortChange(nextState)}
        >
          Name
          {nameSort === "asc" ? (
            <ArrowUpAZ className="h-4 w-4" />
          ) : nameSort === "desc" ? (
            <ArrowDownAZ className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </HeaderButton>
      );
    },
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
  {
    accessorKey: "category",
    header: () => (
      <CategoryFilterHeader
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        categories={categories}
      />
    ),
    cell: ({ getValue }) =>
      typeof getValue() === "string" ? (
        <Badge variant="outline">{getValue() as string}</Badge>
      ) : (getValue() as any)?.name ? (
        <Badge variant="outline">{(getValue() as any).name}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "price",
    header: () => (
      <RangeFilterHeader
        label="Price"
        sort={priceSort}
        onSortChange={onPriceSortChange}
        min={priceMin}
        max={priceMax}
        onMinChange={onPriceMinChange}
        onMaxChange={onPriceMaxChange}
        step="0.01"
      />
    ),
    cell: ({ row }) => {
      const regularPrice = Number(row.original.price);
      const hasSale = row.original.salePrice && Number(row.original.salePrice) > 0;
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
  {
    accessorKey: "qtyInStock",
    header: () => (
      <RangeFilterHeader
        label="Stock"
        sort={stockSort}
        onSortChange={onStockSortChange}
        min={stockMin}
        max={stockMax}
        onMinChange={onStockMinChange}
        onMaxChange={onStockMaxChange}
        step="1"
      />
    ),
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
              -
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
  categories,
  nameSort,
  onNameSortChange,
  priceSort,
  onPriceSortChange,
  stockSort,
  onStockSortChange,
  categoryFilter,
  onCategoryFilterChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  stockMin,
  stockMax,
  onStockMinChange,
  onStockMaxChange,
}: Props) {
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
          onAdjustStock,
          categories,
          nameSort,
          onNameSortChange,
          priceSort,
          onPriceSortChange,
          stockSort,
          onStockSortChange,
          categoryFilter,
          onCategoryFilterChange,
          priceMin,
          priceMax,
          onPriceMinChange,
          onPriceMaxChange,
          stockMin,
          stockMax,
          onStockMinChange,
          onStockMaxChange
        ),
      [
        onEdit,
        onDelete,
        onUploaded,
        selected,
        toggleSel,
        onAdjustStock,
        categories,
        nameSort,
        onNameSortChange,
        priceSort,
        onPriceSortChange,
        stockSort,
        onStockSortChange,
        categoryFilter,
        onCategoryFilterChange,
        priceMin,
        priceMax,
        onPriceMinChange,
        onPriceMaxChange,
        stockMin,
        stockMax,
        onStockMinChange,
        onStockMaxChange,
      ]
    ),
    state: { globalFilter },
    onGlobalFilterChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/50">
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="whitespace-nowrap font-semibold">
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
