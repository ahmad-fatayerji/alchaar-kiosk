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
      className="relative flex min-h-screen flex-col items-center justify-center bg-white text-[#3da874] select-none"
    >
      {/* Logo — responsive, never taller than 50 vh */}
      <div className="relative w-[60vw] max-w-[450px] h-[50vh] max-h-[50vh]">
        <Image
          src="/logo.svg" // make sure public/logo.svg exists
          alt="Al-Chaar Pharmacy logo"
          fill // fills the wrapper
          priority
          className="object-contain animate-fadeIn pointer-events-none"
        />
      </div>

      {/* Language toggle between logo and welcome text — large buttons */}
      <div className="mt-6 w-full max-w-md px-4" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-2 gap-4" role="group" aria-label="Language switcher">
          <button
            aria-pressed={lang === "en"}
            className={`h-14 rounded-xl border-2 text-lg font-semibold transition-colors flex items-center justify-center ${
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
            className={`h-14 rounded-xl border-2 text-lg font-semibold transition-colors flex items-center justify-center ${
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

      {/* Greeting */}
      <h1 className="mt-6 text-4xl font-semibold tracking-wide text-center">
        {t("welcome")}
      </h1>

      {/* Tap hint */}
      <p className="mt-8 text-xl text-gray-600 animate-pulse">
        {t("tap_anywhere")}
      </p>
    </main>
  );
}
