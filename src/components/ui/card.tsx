import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn(
        "rounded-3xl border bg-card text-card-foreground shadow-sm",
        className
      )}
    />
  )
);
Card.displayName = "Card";

export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-4", props.className)} />;
}

export function CardTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        props.className
      )}
    />
  );
}

export function CardContent(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-4 pt-0", props.className)} />;
}
