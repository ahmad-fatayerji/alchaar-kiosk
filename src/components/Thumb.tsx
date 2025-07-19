"use client";
import React from "react";
import { useThumbVersion } from "@/hooks/useThumbVersion";

export default function Thumb({
  code,
  size = 56,
}: {
  code: string;
  size?: number;
}) {
  const v = useThumbVersion(); // bump changes on every upload
  const base = `/files/products/${code}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

  /** Try the next extension when 404. */
  function fallback(img: HTMLImageElement) {
    const tried = img.src.split("?")[0];
    const ext = tried.slice(tried.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) img.src = `${base}${next}?v=${v}`;
    /* else: out of options – leave src as-is so a future v bump retries */
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-white ring-1 ring-border overflow-hidden"
    >
      <img
        src={`${base}${exts[0]}?v=${v}`}
        onError={(e) => fallback(e.currentTarget)}
        alt=""
        loading="lazy"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
