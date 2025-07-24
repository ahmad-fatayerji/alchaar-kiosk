"use client";

import { useEffect, useState } from "react";
import ProductDialog, { Product } from "./ProductDialog";
import ProductTable from "./ProductTable";
import ProductsToolbar from "./ProductsToolbar";
import BulkAssignDialog, { Category } from "./BulkAssignDialog";
import BulkSaleDialog from "./BulkSaleDialog";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Tag } from "lucide-react";

export default function ProductsPanel() {
  const {
    products,
    selected,
    setSelected,
    busy,
    refresh,
    upsert,
    remove,
    bulkUpload,
    bulkDelete,
    bulkAssign,
  } = useProducts();

  /* ---------- load products on mount ---------- */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ---------- load categories once (only leaf categories) ---------- */
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    fetch("/api/categories/leaf")
      .then((r) => r.text())
      .then((t) => setCats(t.trim() ? (JSON.parse(t) as Category[]) : []));
  }, []);

  /* ---------- UI state ---------- */
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [salesEnabled, setSalesEnabled] = useState(true);

  /* ---------- load sales enabled setting ---------- */
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

  /* ---------- export ---------- */
  const exportAll = () => {
    window.location.href = "/api/products/export";
  };

  /* ---------- bulk assign helper ---------- */
  const assignTo = (catId: number | null) => {
    setAssignOpen(false);
    bulkAssign([...selected], catId);
  };

  /* ---------- bulk sale helper ---------- */
  const handleSaleSuccess = () => {
    setSelected(new Set()); // Clear selection
    refresh(); // Refresh products
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <p className="text-muted-foreground mt-1">Inventory management</p>
      </div>

      {/* Sales Disabled Banner */}
      {!salesEnabled && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Sales Features Disabled
                </Badge>
              </div>
              <p className="text-sm text-yellow-800">
                Sales and discount features are currently disabled. The bulk
                sale management, sale price fields, and sale price displays are
                hidden.
              </p>
              <p className="text-xs text-yellow-700 mt-2 flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Enable sales features in Settings to use bulk sales and sale
                pricing.
              </p>
            </div>
          </div>
        </div>
      )}

      <ProductsToolbar
        search={search}
        onSearch={setSearch}
        onNew={() => setEditing(null)}
        onBulk={bulkUpload}
        onExport={exportAll}
        onBulkDelete={() => bulkDelete([...selected])}
        onBulkAssignClick={() => setAssignOpen(true)}
        onBulkSaleClick={() => setSaleOpen(true)}
        disabled={busy}
        selectedCount={selected.size}
      />

      <Card>
        <CardContent className="p-0">
          <ProductTable
            data={products}
            globalFilter={search}
            selected={selected}
            setSelected={setSelected}
            onEdit={setEditing}
            onDelete={remove}
            onUploaded={refresh}
            salesEnabled={salesEnabled}
          />
        </CardContent>
      </Card>

      {/* product edit dialog */}
      <ProductDialog
        open={editing !== undefined}
        product={editing ?? null}
        cats={cats}
        busy={busy}
        onCancel={() => setEditing(undefined)}
        onSave={upsert}
      />

      {/* bulk-assign dialog */}
      <BulkAssignDialog
        open={assignOpen}
        cats={cats}
        onClose={() => setAssignOpen(false)}
        onAssign={assignTo}
      />

      {/* bulk-sale dialog */}
      <BulkSaleDialog
        open={saleOpen}
        selectedBarcodes={[...selected]}
        onClose={() => setSaleOpen(false)}
        onSuccess={handleSaleSuccess}
      />
    </>
  );
}
