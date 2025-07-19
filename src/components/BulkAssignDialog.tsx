"use client";

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
  const handle = (value: string) =>
    onAssign(value === "_none" ? null : Number(value));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move selected products</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh]">
          <ScrollArea>
            <RadioGroup
              defaultValue="_none"
              onValueChange={handle}
              className="grid gap-3"
            >
              <Label className="flex items-center gap-3 text-sm cursor-pointer">
                <RadioGroupItem value="_none" /> — None —
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
