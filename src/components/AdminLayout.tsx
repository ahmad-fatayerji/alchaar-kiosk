"use client";

import { ReactNode } from "react";
import { logout } from "@/lib/adminAuth";
import { Package, Tags, FolderTree, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "filters", label: "Filters", icon: Tags },
  { id: "products", label: "Products", icon: Package },
] as const;

export type Tab = (typeof tabs)[number]["id"];

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
    <main className="flex h-screen">
      {/* ───────── sidebar ───────── */}
      <aside className="w-64 shrink-0 bg-gray-900 text-gray-200 shadow-lg flex flex-col">
        <h1 className="px-6 py-4 text-xl font-semibold tracking-wide">
          Admin&nbsp;Panel
        </h1>

        <nav className="flex-1 px-2 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTab(id)}
              className={cn(
                "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                id === tab
                  ? "bg-gray-700 text-white"
                  : "hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            location.reload();
          }}
          className="flex items-center gap-2 px-6 py-4 text-sm text-gray-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      {/* ───────── main area ───────── */}
      <section className="flex-1 overflow-y-auto bg-muted p-6">
        {children}
      </section>
    </main>
  );
}
