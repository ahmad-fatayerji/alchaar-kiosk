// src/app/layout.tsx
import "@/app/global.css";
import type { Metadata } from "next";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LangContext";
import { Roboto } from "next/font/google";
import KioskBoot from "@/components/KioskBoot";
import LangToggleHost from "@/components/LangToggleHost";

export const metadata: Metadata = {
  title: "Al-Chaar Pharmacy",
  description: "Welcome kiosk screen",
};

// Font loaders must be called at module scope
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className}>
      <head>
        <script
          // Feature detect modern color / viewport units early
          dangerouslySetInnerHTML={{
            __html: `(() => {try {const d=document.documentElement; if(!CSS.supports('color','oklch(0.6 0.1 120'))){d.classList.add('no-oklch');} if(!CSS.supports('height','100svh')){d.classList.add('no-svh');} } catch(e) { /* ignore */ }})();`,
          }}
        />
      </head>
      <body>
        <LanguageProvider>
          <CartProvider>
            <KioskBoot />
            <LangToggleHost />
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
