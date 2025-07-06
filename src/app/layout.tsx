// Global layout for every route — no locale logic.
import type { Metadata } from "next";
import "@/app/global.css";

export const metadata: Metadata = {
  title: "Al-Chaar Kiosk",
  description: "Self-service kiosk app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}
