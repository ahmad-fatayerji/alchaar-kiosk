/* ------------------------------------------------------------------
   src/app/page.tsx        ←  REPLACE THE ENTIRE FILE WITH THIS COPY
   -----------------------------------------------------------------*/
"use client";

import Image from "next/image";
import { useI18n } from "@/contexts/LangContext";

export default function Home() {
  const { t, lang, setLang } = useI18n();
  // Navigate to /browse on any tap / click
  const handleStart = () => {
    window.location.href = "/browse";
  };

  return (
    <main
      onClick={handleStart}
      className="relative kiosk-viewport home-hero-tight flex min-h-screen flex-col items-center justify-center bg-white text-[#3da874] select-none"
    >
      {/* Logo — slightly bigger and higher */}
      <div className="logo relative w-[72vw] max-w-[720px] h-[58vh] max-h-[58vh] -mt-10">
        <Image
          src="/logo.svg" // make sure public/logo.svg exists
          alt="Al-Chaar Pharmacy logo"
          fill // fills the wrapper
          priority
          className="object-contain animate-fadeIn pointer-events-none"
        />
      </div>

      {/* Language toggle — closer and larger buttons/text */}
      <div
        className="below-logo mt-2 w-full max-w-lg px-4 kiosk-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="grid grid-cols-2 gap-5"
          role="group"
          aria-label="Language switcher"
        >
          <button
            aria-pressed={lang === "en"}
            className={`kiosk-button h-16 rounded-xl border-2 text-2xl font-semibold transition-colors flex items-center justify-center ${
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
            className={`kiosk-button h-16 rounded-xl border-2 text-2xl font-semibold transition-colors flex items-center justify-center ${
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

      {/* Greeting — larger and tighter spacing */}
      <h1 className="welcome mt-3 kiosk-title text-4xl font-semibold tracking-wide text-center">
        {t("welcome")}
      </h1>

      {/* Tap hint — larger and moved up */}
      <p className="hint mt-4 kiosk-text text-2xl text-gray-600 animate-pulse">
        {t("tap_anywhere")}
      </p>
    </main>
  );
}
