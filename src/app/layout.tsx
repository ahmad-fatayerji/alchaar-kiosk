// src/app/layout.tsx
import "@/app/global.css";
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
