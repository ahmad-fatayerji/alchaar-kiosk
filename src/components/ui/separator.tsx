import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Separator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  );
}
