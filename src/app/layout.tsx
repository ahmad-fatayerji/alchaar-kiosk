// src/app/layout.tsx
import "@/app/global.css";
import type { Metadata } from "next";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "Al-Chaar Pharmacy",
  description: "Welcome kiosk screen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
