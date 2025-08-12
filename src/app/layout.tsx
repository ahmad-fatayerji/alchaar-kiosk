// src/app/layout.tsx
import "@/app/global.css";
import type { Metadata } from "next";
import { CartProvider } from "@/contexts/CartContext";
import { Roboto } from "next/font/google";

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
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
