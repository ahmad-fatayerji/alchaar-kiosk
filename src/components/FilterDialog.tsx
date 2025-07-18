"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export type FilterRow = {
  id: number;
  name: string;
  type: "LABEL" | "NUMBER" | "RANGE";
  units: string | null;
};

type Props = {
  open: boolean;
  filter: FilterRow | null;
  onClose(): void;
  onSaved(): void;
};

export default function FilterDialog({
  open,
  filter,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(filter?.name ?? "");
  const [units, setUnits] = useState(filter?.units ?? "");
  const [type, setType] = useState<FilterRow["type"]>(filter?.type ?? "LABEL");
  const [busy, setBusy] = useState(false);

  /* reset when a new row is selected */
  useEffect(() => {
    setName(filter?.name ?? "");
    setUnits(filter?.units ?? "");
    setType(filter?.type ?? "LABEL");
  }, [filter]);

  if (!filter) return null;

  async function save() {
    setBusy(true);

    /* 1️⃣ name + units */
    await fetch(`/api/filters/${filter!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), units: units.trim() || null }),
    });

    /* 2️⃣ type change */
    if (type !== filter!.type) {
      await fetch(`/api/filters/${filter!.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    }

    setBusy(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit filter</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Units&nbsp;(optional)</Label>
            <Input
              placeholder="e.g. years, kg …"
              value={units ?? ""}
              onChange={(e) => setUnits(e.target.value)}
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LABEL">LABEL&nbsp;(yes / no)</SelectItem>
                <SelectItem value="NUMBER">NUMBER&nbsp;(integer)</SelectItem>
                <SelectItem value="RANGE">RANGE&nbsp;(from – to)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy || !name.trim()} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
