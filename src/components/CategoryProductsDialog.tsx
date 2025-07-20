"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchBox from "./SearchBox";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type ProdRow = {
  barcode: string;
  name: string;
  categoryId: number | null;
};

export default function CategoryProductsDialog({
  open,
  catId,
  onClose,
  onSaved,
}: {
  open: boolean;
  catId: number;
  onClose(): void;
  onSaved(): void; // parent reload tree
}) {
  const [rows, setRows] = useState<ProdRow[]>([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  /* load whole list once and check if category is leaf */
  useEffect(() => {
    if (!open) return;

    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      // Check if this category has children (not a leaf)
      fetch(`/api/categories/${catId}`).then((r) => r.json()),
      // Get category info
      fetch(`/api/categories/${catId}/info`).then((r) => r.json()),
    ]).then(([products, children, categoryInfo]) => {
      setRows(products);
      const hasChildren = children.length > 0;
      setIsLeafCategory(!hasChildren);
      setCategoryName(categoryInfo.name);

      // Only set selected products if this is a leaf category
      if (!hasChildren) {
        setSel(
          new Set(
            products
              .filter((p: ProdRow) => p.categoryId === catId)
              .map((p: ProdRow) => p.barcode)
          )
        );
      } else {
        setSel(new Set());
      }
    });
  }, [open, catId]);

  function toggle(code: string) {
    setSel((s) => {
      const cp = new Set(s);
      if (cp.has(code)) cp.delete(code);
      else cp.add(code);
      return cp;
    });
  }

  async function save() {
    setBusy(true);
    const add: string[] = [];
    const remove: string[] = [];

    rows.forEach((p) => {
      const inSel = sel.has(p.barcode);
      const currentlyInCat = p.categoryId === catId;
      if (inSel && !currentlyInCat) add.push(p.barcode);
      if (!inSel && currentlyInCat) remove.push(p.barcode);
    });

    await fetch("/api/category-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: catId, add, remove }),
    });

    setBusy(false);
    onSaved();
    onClose();
  }

  const shown = rows.filter((r) =>
    r.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage products in "{categoryName}" category
          </DialogTitle>
        </DialogHeader>

        {!isLeafCategory ? (
          /* Non-leaf category - show warning */
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Non-Leaf Category
                </Badge>
              </div>
              <p className="text-yellow-800 text-sm">
                Products can only be assigned to leaf categories (categories
                without subcategories). This category has subcategories, so
                products cannot be directly assigned to it.
              </p>
              <p className="text-yellow-700 text-xs mt-2">
                Navigate to a subcategory that has no further subcategories to
                manage products.
              </p>
            </div>
          </div>
        ) : (
          /* Leaf category - show product management */
          <>
            <SearchBox
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mb-3 w-full"
            />

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1 pr-2"></th>
                  <th className="py-1 pr-2">Barcode</th>
                  <th className="py-1">Name</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.barcode} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      <Checkbox
                        checked={sel.has(p.barcode)}
                        onCheckedChange={() => toggle(p.barcode)}
                      />
                    </td>
                    <td className="py-1 pr-2">{p.barcode}</td>
                    <td className="py-1">{p.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {isLeafCategory ? "Cancel" : "Close"}
          </Button>
          {isLeafCategory && (
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
