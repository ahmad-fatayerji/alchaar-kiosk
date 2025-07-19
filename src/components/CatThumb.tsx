// src/components/CatThumb.tsx
"use client";

/**
 * Category thumbnail.
 * • Shows the image immediately after upload (no HEAD probe).
 * • Uses the dynamic /files route so Next.js’s static snapshot is bypassed.
 * • Cache-busts with ?v=<timestamp> to avoid stale 404s.
 */
export default function CatThumb({
  id,
  folder = "categories",
  size = 56,
}: {
  id: string | number;
  folder?: "categories" | "products";
  size?: number;
}) {
  const base = `/files/${folder}/${id}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
  const ver = Date.now(); // new on every render → bypass browser cache

  /** If the current extension 404s, try the next one. */
  function fallback(img: HTMLImageElement) {
    const tried = img.src.split("?")[0]; // strip ?v
    const ext = tried.slice(tried.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) img.src = `${base}${next}?v=${ver}`;
    else img.style.display = "none"; // none matched
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-white ring-1 ring-border overflow-hidden shrink-0"
    >
      <img
        src={`${base}${exts[0]}?v=${ver}`}
        onError={(e) => fallback(e.currentTarget)}
        alt=""
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
