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
      className="relative kiosk-viewport home-hero home-hero-tight flex min-h-screen flex-col items-center justify-center bg-white text-[#3da874] select-none"
    >
      {/* Default desktop sizes; kiosk scales via global css */}
      <div className="logo relative w-[60vw] max-w-[520px] h-[40vh] max-h-[40vh] -mt-4 kiosk-portrait:w-[86vw] kiosk-portrait:max-w-[900px] kiosk-portrait:h-[70vh] kiosk-portrait:max-h-[70vh] kiosk-portrait:-mt-14">
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
        className="below-logo mt-3 w-full max-w-md px-4 kiosk-text kiosk-portrait:mt-0.5 kiosk-portrait:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="grid grid-cols-2 gap-4 kiosk-portrait:gap-4"
          role="group"
          aria-label="Language switcher"
        >
          <button
            aria-pressed={lang === "en"}
            className={`h-12 rounded-xl border-2 text-lg font-semibold transition-colors flex items-center justify-center kiosk-portrait:h-[88px] kiosk-portrait:text-[2.2rem] ${
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
            className={`h-12 rounded-xl border-2 text-lg font-semibold transition-colors flex items-center justify-center kiosk-portrait:h-[88px] kiosk-portrait:text-[2.2rem] ${
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
      <h1 className="welcome mt-5 text-3xl font-semibold tracking-wide text-center kiosk-portrait:mt-2 kiosk-portrait:text-[3.5rem]">
        {t("welcome")}
      </h1>

      {/* Tap hint — larger and moved up */}
      <p className="hint mt-6 text-lg text-gray-600 animate-pulse kiosk-portrait:mt-2 kiosk-portrait:text-[2.1rem]">
        {t("tap_anywhere")}
      </p>
    </main>
  );
}
