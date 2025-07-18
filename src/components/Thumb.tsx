"use client";

/**
 * Re-usable thumbnail component.
 * Renders a **fixed-size square** (defaults to 56 px) and
 * falls back through multiple extensions until one exists.
 */
export default function Thumb({
  code,
  size = 56, // ← tweak this once and it scales everywhere
}: {
  code: string;
  size?: number;
}) {
  const base = `/products/${code}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

  /** swap to next extension when 404 */
  function fallback(img: HTMLImageElement) {
    const curr = img.src;
    const ext = curr.slice(curr.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) img.src = base + next;
    else img.style.display = "none"; // nothing matched
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-white ring-1 ring-border overflow-hidden"
    >
      <img
        src={base + exts[0]}
        onError={(e) => fallback(e.currentTarget)}
        alt=""
        loading="lazy"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
