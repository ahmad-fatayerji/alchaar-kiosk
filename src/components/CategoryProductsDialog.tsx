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

  /* load whole list once */
  useEffect(() => {
    if (!open) return;
    fetch("/api/products")
      .then((r) => r.json())
      .then((j: ProdRow[]) => {
        setRows(j);
        setSel(
          new Set(j.filter((p) => p.categoryId === catId).map((p) => p.barcode))
        );
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
          <DialogTitle>Manage products in this category</DialogTitle>
        </DialogHeader>

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

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
