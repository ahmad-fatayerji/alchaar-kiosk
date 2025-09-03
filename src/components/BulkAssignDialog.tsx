"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";

export type Category = { id: number; name: string };
const NONE_VAL = "_none";

type Props = {
  open: boolean;
  cats: Category[];
  onClose(): void;
  onAssign(catId: number | null): void;
};

export default function BulkAssignDialog({
  open,
  cats,
  onClose,
  onAssign,
}: Props) {
  /* local selection state */
  const [choice, setChoice] = useState<string>(NONE_VAL);

  /* reset to “None” whenever dialog opens */
  useEffect(() => {
    if (open) setChoice(NONE_VAL);
  }, [open]);

  function handleAssign() {
    const catId = choice === NONE_VAL ? null : Number(choice);
    onAssign(catId);
  }

  /* filtering */
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return cats;
    const q = query.trim().toLowerCase();
    return cats.filter(
      (c) => c.name.toLowerCase().includes(q) || String(c.id).includes(q)
    );
  }, [cats, query]);

  const needsVirtual = filtered.length > 400; // threshold
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ROW_H = 32;
  const OVERSCAN = 8;
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    if (!open) setScrollTop(0);
  }, [open]);
  function onScroll() {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }
  const viewportH = 480; // ~60vh typical
  const start = needsVirtual
    ? Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN)
    : 0;
  const end = needsVirtual
    ? Math.min(
        filtered.length,
        Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN
      )
    : filtered.length;
  const slice = filtered.slice(start, end);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move selected products</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div
            ref={containerRef}
            onScroll={needsVirtual ? onScroll : undefined}
            className="max-h-[60vh] overflow-y-auto pr-2 border rounded"
            style={{ position: "relative" }}
          >
            <RadioGroup
              value={choice}
              onValueChange={setChoice}
              className="grid gap-1"
              style={
                needsVirtual ? { height: filtered.length * ROW_H } : undefined
              }
            >
              {/* Always render 'None' at top (not virtualized) */}
              {!needsVirtual && (
                <Label
                  className="flex items-center gap-3 text-sm cursor-pointer h-8"
                  onClick={() => setChoice(NONE_VAL)}
                >
                  <RadioGroupItem value={NONE_VAL} /> — None —
                </Label>
              )}
              {needsVirtual && (
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "var(--background, white)",
                    zIndex: 10,
                  }}
                >
                  <Label
                    className="flex items-center gap-3 text-sm cursor-pointer h-8"
                    onClick={() => setChoice(NONE_VAL)}
                  >
                    <RadioGroupItem value={NONE_VAL} /> — None —
                  </Label>
                </div>
              )}
              {/* Virtual window */}
              {needsVirtual ? (
                <div
                  style={{
                    position: "absolute",
                    top: start * ROW_H,
                    left: 0,
                    right: 0,
                  }}
                >
                  {slice.map((c) => (
                    <Label
                      key={c.id}
                      className="flex items-center gap-3 text-sm cursor-pointer h-8"
                      onClick={() => setChoice(c.id.toString())}
                    >
                      <RadioGroupItem value={c.id.toString()} />
                      {c.id} – {c.name}
                    </Label>
                  ))}
                </div>
              ) : (
                filtered.map((c) => (
                  <Label
                    key={c.id}
                    className="flex items-center gap-3 text-sm cursor-pointer h-8"
                    onClick={() => setChoice(c.id.toString())}
                  >
                    <RadioGroupItem value={c.id.toString()} />
                    {c.id} – {c.name}
                  </Label>
                ))
              )}
            </RadioGroup>
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No categories match.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
