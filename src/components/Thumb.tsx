"use client";

export default function Thumb({
  code,
  size = 48,
}: {
  code: string;
  size?: number;
}) {
  const base = `/products/${code}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

  function fallback(img: HTMLImageElement) {
    const ext = "." + new URL(img.src).pathname.split(".").pop()!;
    const next = exts.indexOf(ext) + 1;
    if (next < exts.length) img.src = base + exts[next];
    else img.hidden = true;
  }

  return (
    <img
      src={base + exts[0]}
      onError={(e) => fallback(e.currentTarget)}
      className="rounded bg-white ring-1 ring-gray-200 object-contain"
      style={{ width: size, height: size }}
      alt=""
      loading="lazy"
    />
  );
}
