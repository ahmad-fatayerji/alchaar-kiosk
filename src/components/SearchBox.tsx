"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange(e: React.ChangeEvent<HTMLInputElement>): void;
  placeholder?: string;
  className?: string;
};

/** Consistent search field with 🔍 icon (width is controlled by className). */
export default function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-8"
      />
    </div>
  );
}
