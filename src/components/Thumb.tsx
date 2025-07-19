"use client";

import React from "react";

/**
 * Product thumbnail.
 * • Fixed square (size = 56 px by default)
 * • Tries .webp → .jpg → .jpeg → .png → .avif
 * • `?v=<timestamp>` busts any 404/stale-image cache
 */
export default function Thumb({
  code,
  size = 56,
}: {
  code: string;
  size?: number;
}) {
  const base = `/files/products/${code}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
  const ver = Date.now(); // new on every render

  /** Swap to the next extension when the current one 404s. */
  function fallback(img: HTMLImageElement) {
    const tried = img.src.split("?")[0];
    const ext = tried.slice(tried.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) img.src = `${base}${next}?v=${ver}`;
    else img.style.display = "none"; // none matched
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-white ring-1 ring-border overflow-hidden"
    >
      <img
        src={`${base}${exts[0]}?v=${ver}`}
        onError={(e) => fallback(e.currentTarget)}
        alt=""
        loading="lazy"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
