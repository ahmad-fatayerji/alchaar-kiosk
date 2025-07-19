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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─────────── Types ─────────── */
export type Category = { id: number; name: string };
export type Product = {
  barcode: string;
  name: string;
  price: string;
  qtyInStock: number;
  categoryId: number | null;
};

/* sentinel for “no category” */
const NONE = "_none";

type Props = {
  open: boolean;
  product: Product | null;
  cats: Category[];
  busy: boolean;
  onCancel(): void;
  onSave(p: Partial<Product>, values: any[]): void;
};

/* ------------------------------------------------------------------ */
export default function ProductDialog({
  open,
  product,
  cats,
  busy,
  onCancel,
  onSave,
}: Props) {
  /* ---------- static product fields ---------- */
  const [form, setForm] = useState({
    barcode: "",
    name: "",
    price: "",
    stock: "",
    catId: NONE, // default to “no category”
  });

  useEffect(() => {
    setForm({
      barcode: product?.barcode ?? "",
      name: product?.name ?? "",
      price: product?.price ?? "",
      stock: product?.qtyInStock.toString() ?? "",
      catId:
        product && product.categoryId != null
          ? product.categoryId.toString()
          : NONE,
    });
  }, [product, open]);

  const upd = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  /* ---------- dynamic filters ---------- */
  const [defs, setDefs] = useState<
    { id: number; name: string; type: "LABEL" | "NUMBER" | "RANGE" }[]
  >([]);
  const [vals, setVals] = useState<Record<number, any>>({});

  /* fetch filter-defs whenever category changes */
  useEffect(() => {
    const cat = Number(form.catId);
    if (!cat) {
      setDefs([]);
      setVals({});
      return;
    }
    fetch(`/api/categories/${cat}/filters`)
      .then((r) => r.json())
      .then(setDefs)
      .then(() => setVals({}));
  }, [form.catId]);

  const put = (id: number, patch: object) =>
    setVals((s) => ({
      ...s,
      [id]: { ...(s[id] ?? { filterId: id }), ...patch },
    }));

  /* ---- render helpers for filters ---- */
  function render(def: (typeof defs)[number]) {
    const v = vals[def.id] ?? {};
    switch (def.type) {
      case "LABEL":
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!v.labelVal}
              onChange={(e) =>
                put(def.id, { labelVal: e.target.checked ? "1" : null })
              }
            />
            {v.labelVal ? "yes" : "no"}
          </label>
        );
      case "NUMBER":
        return (
          <Input
            type="number"
            step="1"
            value={v.numberVal ?? ""}
            onChange={(e) =>
              put(def.id, {
                numberVal:
                  e.target.value === "" ? null : e.target.valueAsNumber,
              })
            }
          />
        );
      case "RANGE":
        return (
          <div className="flex gap-2">
            <Input
              className="flex-1"
              type="number"
              step="1"
              placeholder="from"
              value={v.rangeFrom ?? ""}
              onChange={(e) =>
                put(def.id, {
                  rangeFrom:
                    e.target.value === "" ? null : e.target.valueAsNumber,
                })
              }
            />
            <Input
              className="flex-1"
              type="number"
              step="1"
              placeholder="to"
              value={v.rangeTo ?? ""}
              onChange={(e) =>
                put(def.id, {
                  rangeTo:
                    e.target.value === "" ? null : e.target.valueAsNumber,
                })
              }
            />
          </div>
        );
    }
  }

  const disabled = !form.barcode || !form.name.trim() || !form.price; // category may be NONE

  /* ---------- render ---------- */
  return (
    <Dialog open={open} onOpenChange={open ? onCancel : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        {/* ---- form fields ---- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Barcode</Label>
              <Input
                value={form.barcode}
                disabled={!!product}
                onChange={(e) => upd("barcode", e.target.value)}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={form.catId} onValueChange={(v) => upd("catId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => upd("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price&nbsp;($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => upd("price", e.target.value)}
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                step="1"
                value={form.stock}
                onChange={(e) => upd("stock", e.target.value)}
              />
            </div>
          </div>

          {/* ---- dynamic filters ---- */}
          {defs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              {defs.map((d) => (
                <div key={d.id} className="grid gap-2">
                  <Label>{d.name}</Label>
                  {render(d)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- actions ---- */}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={disabled || busy}
            onClick={() =>
              onSave(
                {
                  barcode: form.barcode,
                  categoryId: form.catId === NONE ? null : Number(form.catId),
                  name: form.name.trim(),
                  price: form.price,
                  qtyInStock: Number(form.stock || 0),
                },
                /* keep only rows with at least one populated field */
                Object.values(vals).filter(
                  (v) =>
                    v.labelVal != null ||
                    v.numberVal != null ||
                    v.rangeFrom != null ||
                    v.rangeTo != null
                )
              )
            }
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
