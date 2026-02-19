"use client";

import { useEffect } from "react";

type ImageViewerProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export default function ImageViewer({
  open,
  src,
  alt,
  onClose,
}: ImageViewerProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <img
        src={src}
        alt={alt}
        className="max-w-[94vw] max-h-[90vh] object-contain select-none"
        onClick={(event) => event.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}
