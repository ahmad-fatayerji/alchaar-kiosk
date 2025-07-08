"use client";
import { ReactNode } from "react";

export default function KeyHint({
  k,
  children,
}: {
  k: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
      <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold shadow-inner dark:bg-gray-700">
        {k}
      </kbd>
      {children}
    </span>
  );
}
