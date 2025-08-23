"use client";

import { useI18n } from "@/contexts/LangContext";
import { usePathname } from "next/navigation";
import { useCallback } from "react";

/* Floating language toggle shown on all shopper (non-admin) pages. */
export default function LangToggle() {
  const { lang, setLang } = useI18n();
  const pathname = usePathname() || "/";

  // Hide on admin & auth style routes
  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order")
  ) {
    return null;
  }

  const handleSelect = useCallback(
    (l: "en" | "ar") => {
      setLang(l);
    },
    [setLang]
  );

  return (
    <div
      className="fixed top-3 right-3 z-50 flex gap-2 kiosk-portrait:top-6 kiosk-portrait:right-6"
      onClick={(e) => e.stopPropagation()}
    >
      {(["en", "ar"] as const).map((code) => (
        <button
          key={code}
          aria-label={code === "en" ? "English" : "Arabic"}
          aria-pressed={lang === code}
          onClick={() => handleSelect(code)}
          className={`px-3 h-10 rounded-xl border-2 font-semibold tracking-wide transition-colors text-sm kiosk-portrait:h-24 kiosk-portrait:text-[2rem] kiosk-portrait:px-8 kiosk-portrait:rounded-2xl ${
            lang === code
              ? "bg-[#3da874] text-white border-[#3da874] shadow"
              : "bg-white/90 backdrop-blur-sm text-[#3da874] border-[#3da874] hover:bg-green-50"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
