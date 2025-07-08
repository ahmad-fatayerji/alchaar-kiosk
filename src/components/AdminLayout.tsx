"use client";

import { logout } from "@/lib/adminAuth";
import { ReactNode } from "react";

const tabs = ["categories", "filters", "products"] as const;
export type Tab = (typeof tabs)[number];

export default function AdminLayout({
  tab,
  onTab,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  children: ReactNode;
}) {
  return (
    <main className="flex h-screen flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between bg-gray-800 px-6 py-3 text-white">
        <nav className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => onTab(t)}
              className={t === tab ? "font-bold underline" : ""}
            >
              {t}
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            location.reload();
          }}
          className="text-sm opacity-80 hover:opacity-100"
        >
          Logout
        </button>
      </header>

      {/* work area */}
      <section className="flex-1 overflow-y-auto p-6">{children}</section>
    </main>
  );
}
