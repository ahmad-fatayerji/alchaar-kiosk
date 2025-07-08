"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

/** Render children into <body> so they escape any parent overflow/z-index. */
export default function Portal({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  if (!elRef.current) elRef.current = document.createElement("div");

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return createPortal(children, elRef.current);
}
