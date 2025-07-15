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

export type Category = { id: number; name: string };
export type Product = {
  barcode: string;
  name: string;
  price: string;
  qtyInStock: number;
  categoryId: number;
};

type Props = {
  open: boolean;
  product: Product | null;
  cats: Category[];
  busy: boolean;
  onCancel(): void;
  onSave(p: Partial<Product>): void;
};

export default function ProductDialog({
  open,
  product,
  cats,
  busy,
  onCancel,
  onSave,
}: Props) {
  const [form, setForm] = useState({
    barcode: product?.barcode ?? "",
    name: product?.name ?? "",
    price: product?.price ?? "",
    stock: product?.qtyInStock.toString() ?? "",
    catId: product?.categoryId.toString() ?? (cats[0]?.id.toString() || ""),
  });

  useEffect(() => {
    setForm({
      barcode: product?.barcode ?? "",
      name: product?.name ?? "",
      price: product?.price ?? "",
      stock: product?.qtyInStock.toString() ?? "",
      catId: product?.categoryId.toString() ?? (cats[0]?.id.toString() || ""),
    });
  }, [product, cats]);

  const upd = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const disabled =
    !form.barcode || !form.name.trim() || !form.price || !form.catId;

  return (
    <Dialog open={open} onOpenChange={open ? onCancel : undefined}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        {/* ---- fields ---- */}
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
              <Label>Price ($)</Label>
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
                value={form.stock}
                onChange={(e) => upd("stock", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={disabled || busy}
            onClick={() =>
              onSave({
                barcode: form.barcode,
                categoryId: Number(form.catId),
                name: form.name.trim(),
                price: form.price,
                qtyInStock: Number(form.stock || 0),
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
