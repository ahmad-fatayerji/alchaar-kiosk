/* ------------------------------------------------------------------
   src/app/page.tsx        ←  REPLACE THE ENTIRE FILE WITH THIS COPY
   -----------------------------------------------------------------*/
"use client";

import Image from "next/image";

export default function Home() {
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

      {/* Greeting */}
      <h1 className="mt-6 text-4xl font-semibold tracking-wide text-center">
        Welcome&nbsp;to&nbsp;Al-Chaar&nbsp;Pharmacy
      </h1>

      {/* Tap hint */}
      <p className="mt-8 text-xl text-gray-600 animate-pulse">
        Tap anywhere to begin
      </p>
    </main>
  );
}
