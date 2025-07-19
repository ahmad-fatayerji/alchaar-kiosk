"use client";
import { useThumbVersion } from "@/hooks/useThumbVersion";

export default function CatThumb({
  id,
  folder = "categories",
  size = 56,
}: {
  id: string | number;
  folder?: "categories" | "products";
  size?: number;
}) {
  const v = useThumbVersion();
  const base = `/files/${folder}/${id}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

  function fallback(img: HTMLImageElement) {
    const tried = img.src.split("?")[0];
    const ext = tried.slice(tried.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) img.src = `${base}${next}?v=${v}`;
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-white ring-1 ring-border overflow-hidden shrink-0"
    >
      <img
        src={`${base}${exts[0]}?v=${v}`}
        onError={(e) => fallback(e.currentTarget)}
        alt=""
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
