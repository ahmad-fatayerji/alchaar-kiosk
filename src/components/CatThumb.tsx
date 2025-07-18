"use client";

/** Small square thumbnail for a category. */
export default function CatThumb({
  id,
  size = 28,
}: {
  id: number;
  size?: number;
}) {
  const base = `/categories/${id}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

  function fallback(img: HTMLImageElement) {
    const ext = img.src.slice(img.src.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) img.src = base + next;
    else img.style.display = "none";
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center overflow-hidden rounded bg-white ring-1 ring-border"
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
