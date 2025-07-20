"use client";

import { ReactNode } from "react";
import { logout } from "@/lib/adminAuth";
import { Package, Tags, FolderTree, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const tabs = [
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "filters", label: "Filters", icon: Tags },
  { id: "products", label: "Products", icon: Package },
  { id: "settings", label: "Settings", icon: Settings },
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
    <main className="flex h-screen bg-background">
      {/* ───────── sidebar ───────── */}
      <aside className="w-64 shrink-0 bg-card border-r border-border shadow-sm flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={id === tab ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3",
                id === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              onClick={() => onTab(id)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 px-3 text-muted-foreground hover:text-foreground"
            onClick={() => {
              logout();
              location.reload();
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ───────── main area ───────── */}
      <section className="flex-1 overflow-y-auto bg-muted/30 p-8">
        {children}
      </section>
    </main>
  );
}
