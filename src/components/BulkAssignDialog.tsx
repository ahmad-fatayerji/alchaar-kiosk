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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@radix-ui/react-scroll-area";
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move selected products</DialogTitle>
        </DialogHeader>

        {/* scrollable list of categories */}
        <div className="max-h-[60vh]">
          <ScrollArea>
            <RadioGroup
              value={choice}
              onValueChange={setChoice}
              className="grid gap-3"
            >
              <Label className="flex items-center gap-3 text-sm cursor-pointer">
                <RadioGroupItem value={NONE_VAL} /> — None —
              </Label>

              {cats.map((c) => (
                <Label
                  key={c.id}
                  className="flex items-center gap-3 text-sm cursor-pointer"
                >
                  <RadioGroupItem value={c.id.toString()} />
                  {c.id} – {c.name}
                </Label>
              ))}
            </RadioGroup>
          </ScrollArea>
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
