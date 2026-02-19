"use client";

import Image from "next/image";
import { useI18n } from "@/contexts/LangContext";
import { useEffect } from "react";

export default function HomeLanding() {
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kiosk-cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isOpen) {
          parsed.isOpen = false;
          localStorage.setItem("kiosk-cart", JSON.stringify(parsed));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleStart = () => {
    window.location.href = "/browse";
  };

  return (
    <main
      onClick={handleStart}
      className="relative kiosk-viewport home-hero home-hero-tight flex min-h-screen flex-col items-center justify-center bg-white text-[#3da874] select-none"
    >
      <div className="logo kiosk-home-logo relative w-[60vw] max-w-[520px] h-[40vh] max-h-[40vh] -mt-4">
        <Image
          src="/logo.svg"
          alt="Al-Chaar Pharmacy logo"
          fill
          priority
          className="object-contain animate-fadeIn pointer-events-none"
        />
      </div>

      <div
        className="below-logo kiosk-home-lang-wrap mt-3 w-full max-w-md px-4 kiosk-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="kiosk-home-lang-grid grid grid-cols-2 gap-4"
          role="group"
          aria-label="Language switcher"
        >
          <button
            aria-pressed={lang === "en"}
            className={`kiosk-home-lang-btn h-12 rounded-xl border-2 text-lg font-semibold transition-colors flex items-center justify-center ${
              lang === "en"
                ? "bg-[#3da874] text-white border-[#3da874]"
                : "bg-white text-[#3da874] border-[#3da874] hover:bg-green-50"
            }`}
            onClick={() => setLang("en")}
          >
            <span className="tracking-wide">EN</span>
          </button>
          <button
            aria-pressed={lang === "ar"}
            className={`kiosk-home-lang-btn h-12 rounded-xl border-2 text-lg font-semibold transition-colors flex items-center justify-center ${
              lang === "ar"
                ? "bg-[#3da874] text-white border-[#3da874]"
                : "bg-white text-[#3da874] border-[#3da874] hover:bg-green-50"
            }`}
            onClick={() => setLang("ar")}
          >
            <span className="tracking-wide">AR</span>
          </button>
        </div>
      </div>

      <h1 className="welcome kiosk-home-welcome mt-5 text-3xl font-semibold tracking-wide text-center">
        {t("welcome")}
      </h1>
      <p className="hint kiosk-home-hint mt-6 text-lg text-gray-600 animate-pulse">
        {t("tap_anywhere")}
      </p>
    </main>
  );
}
