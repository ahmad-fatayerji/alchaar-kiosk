"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange(e: React.ChangeEvent<HTMLInputElement>): void;
  placeholder?: string;
  /** Extra Tailwind classes passed from parent (e.g. “w-56”). */
  className?: string;
};

/**
 * Shadcn-style search box
 * – same height / border / focus-ring as <Input size="sm">
 * – icon on the left, input text on the right
 * – no chance of icon/text overlap (flex layout)
 */
export default function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: Props) {
  return (
    <label
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm",
        /* focus ring identical to shadcn <Input> */
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50",
        className
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
