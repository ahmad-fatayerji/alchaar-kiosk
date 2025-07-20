// src/components/TapAnywhere.tsx
"use client";

/** Full-screen invisible button to handle tap/click. */
export default function TapAnywhere() {
  return (
    <button
      onClick={() => (window.location.href = "/browse")}
      className="absolute inset-0 h-full w-full cursor-pointer focus:outline-none"
      aria-label="Begin"
    />
  );
}
