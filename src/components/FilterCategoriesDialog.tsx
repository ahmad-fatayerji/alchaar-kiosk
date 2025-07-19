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
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/* category shape from /api/categories */
type Category = {
  id: number;
  name: string;
  parentId: number | null;
};

type Props = {
  open: boolean;
  filterId: number | null; // filter being edited
  onClose(): void;
  onSaved(): void; // ask parent to reload grid
};

/* -------------------------------------------------- */
/* helper to fetch *all* categories in one flat array */
/* -------------------------------------------------- */
async function fetchAllCats(): Promise<Category[]> {
  const roots: Category[] = await fetch("/api/categories").then((r) =>
    r.json()
  );
  const all: Category[] = [...roots];

  // breadth-first walk
  for (let i = 0; i < all.length; i++) {
    const c = all[i];
    const kids: Category[] = await fetch(`/api/categories/${c.id}`).then((r) =>
      r.json()
    );
    all.push(...kids);
  }
  return all;
}

/* -------------------------------------------------- */
/* Dialog component                                   */
/* -------------------------------------------------- */
export default function FilterCategoriesDialog({
  open,
  filterId,
  onClose,
  onSaved,
}: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [linked, setLinked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  /* load categories + current links */
  useEffect(() => {
    if (!open || !filterId) return;

    (async () => {
      const [all, used]: [Category[], number[]] = await Promise.all([
        fetchAllCats(),
        fetch(`/api/filters/${filterId}/categories`).then((r) => r.json()),
      ]);
      setCats(all.sort((a, b) => a.id - b.id));
      setLinked(new Set(used));
    })();
  }, [open, filterId]);

  /* toggle linked set */
  function toggle(id: number) {
    setLinked((s) => {
      const cp = new Set(s);
      cp.has(id) ? cp.delete(id) : cp.add(id);
      return cp;
    });
  }

  /* persist changes */
  async function save() {
    if (!filterId) return;
    setBusy(true);

    // compute deltas
    const before = new Set<number>(
      await fetch(`/api/filters/${filterId}/categories`).then((r) => r.json())
    );
    const add: number[] = [];
    const remove: number[] = [];

    cats.forEach((c) => {
      const inSel = linked.has(c.id);
      const wasLinked = before.has(c.id);
      if (inSel && !wasLinked) add.push(c.id);
      if (!inSel && wasLinked) remove.push(c.id);
    });

    // fire requests
    await Promise.all([
      ...add.map((catId) =>
        fetch("/api/category-filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: catId, filterId }),
        })
      ),
      ...remove.map((catId) =>
        fetch("/api/category-filters", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: catId, filterId }),
        })
      ),
    ]);

    setBusy(false);
    onSaved();
    onClose();
  }

  /* render list row */
  const row = (c: Category) => (
    <Label
      key={c.id}
      className="flex items-center gap-3 py-1 text-sm cursor-pointer"
    >
      <Checkbox
        checked={linked.has(c.id)}
        onCheckedChange={() => toggle(c.id)}
      />
      {c.id} – {c.name}
    </Label>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach filter to categories</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">{cats.map(row)}</ScrollArea>

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
