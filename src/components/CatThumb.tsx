// src/components/CatThumb.tsx
"use client";

import React, { forwardRef, useEffect, useState } from "react";

type Key = string | number;
const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
const CACHE = new Map<Key, string | null>(); // id → chosen url (or null = none)

/* resolve once per ID, ever */
async function probe(id: Key, folder: string): Promise<string | null> {
  if (CACHE.has(id)) return CACHE.get(id)!;

  for (const ext of exts) {
    const url = `/${folder}/${id}${ext}`;
    try {
      const head = await fetch(url, { method: "HEAD" });
      if (head.ok) {
        CACHE.set(id, url);
        return url;
      }
    } catch {
      /* ignore */
    }
  }
  CACHE.set(id, null);
  return null;
}

/* ------------------------------------------------------------------ */
/* Thumbnail component                                                 */
/* ------------------------------------------------------------------ */
const CatThumb = forwardRef<
  HTMLDivElement,
  { id: Key; folder?: "categories" | "products"; size?: number }
>(function CatThumb({ id, folder = "categories", size = 56 }, ref) {
  const [url, setUrl] = useState<string | null>(() => CACHE.get(id) ?? null);

  /* first (and only) asynchronous probe */
  useEffect(() => {
    if (url !== null || CACHE.has(id)) return; // already resolved
    probe(id, folder).then((resolved) => {
      if (resolved) setUrl(resolved);
      else setUrl(null);
    });
  }, [id, folder, url]);

  return (
    <div
      ref={ref}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-white ring-1 ring-border overflow-hidden shrink-0"
      /* 👇 stable key so React never swaps the DOM element */
      key={`thumb-${id}`}
    >
      {url && (
        <img
          src={url}
          alt=""
          draggable={false}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
});

export default React.memo(CatThumb);
