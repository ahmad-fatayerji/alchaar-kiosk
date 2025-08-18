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
      {/* Language toggle */}
      <div
        className="absolute top-4 right-4 flex gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={`px-3 py-1 rounded-full border ${
            lang === "en"
              ? "bg-[#3da874] text-white"
              : "bg-white text-[#3da874]"
          }`}
          onClick={() => setLang("en")}
        >
          EN
        </button>
        <button
          className={`px-3 py-1 rounded-full border ${
            lang === "ar"
              ? "bg-[#3da874] text-white"
              : "bg-white text-[#3da874]"
          }`}
          onClick={() => setLang("ar")}
        >
          AR
        </button>
      </div>
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
