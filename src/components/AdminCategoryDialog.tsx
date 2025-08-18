"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  mode: "create" | "rename";
  initialName?: string;
  initialArabicName?: string | null;
  onClose(): void;
  onSave(values: {
    name: string;
    arabicName: string | null;
  }): Promise<void> | void;
  parentLabel?: string;
};

export default function AdminCategoryDialog({
  open,
  mode,
  initialName = "",
  initialArabicName = "",
  onClose,
  onSave,
  parentLabel,
}: Props) {
  const [name, setName] = useState(initialName);
  const [arabicName, setArabicName] = useState<string>(initialArabicName ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setArabicName(initialArabicName || "");
      setSaving(false);
    }
  }, [open, initialName, initialArabicName]);

  const title = mode === "create" ? "New Category" : "Rename Category";
  const desc =
    mode === "create"
      ? "Create a new category. You can optionally add an Arabic display name."
      : "Update the category names. Arabic name is optional and used in shopper Arabic mode.";

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        arabicName: arabicName.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        {parentLabel && (
          <div className="text-sm text-muted-foreground -mt-1 mb-3">
            Parent: {parentLabel}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name (English)</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diapers"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-ar-name">Arabic Name (optional)</Label>
            <Input
              id="cat-ar-name"
              value={arabicName}
              onChange={(e) => setArabicName(e.target.value)}
              placeholder="مثال: حفاضات"
              dir="rtl"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
