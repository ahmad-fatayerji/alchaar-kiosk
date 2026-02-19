"use client";

import { ReactNode, useEffect, useState } from "react";
import { logout } from "@/lib/adminAuth";
import {
  Package,
  Tags,
  FolderTree,
  LogOut,
  Settings,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AdminTabItem = {
  id: "categories" | "filters" | "products" | "settings";
  label: string;
  icon: typeof FolderTree;
  disabled?: boolean;
};

export const adminTabs = [
  { id: "categories", label: "Categories", icon: FolderTree, disabled: false },
  { id: "filters", label: "Filters", icon: Tags, disabled: true },
  { id: "products", label: "Products", icon: Package, disabled: false },
  { id: "settings", label: "Settings", icon: Settings, disabled: false },
] as const satisfies readonly AdminTabItem[];

export type Tab = (typeof adminTabs)[number]["id"];

type BuildInfo = {
  appName: string;
  appVersion: string;
  gitSha: string;
  gitRef: string;
  buildTime: string;
  imageRef: string;
  nodeEnv: string;
  checkedAt: string;
};

export default function AdminLayout({
  tab,
  onTab,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  children: ReactNode;
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInfoOpen) return;

    let cancelled = false;

    const loadBuildInfo = async () => {
      setIsInfoLoading(true);
      setInfoError(null);

      try {
        const res = await fetch("/api/build-info", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const data: BuildInfo = await res.json();
        if (!cancelled) setBuildInfo(data);
      } catch (error) {
        if (!cancelled) {
          setInfoError(
            error instanceof Error
              ? error.message
              : "Failed to load build information"
          );
        }
      } finally {
        if (!cancelled) setIsInfoLoading(false);
      }
    };

    loadBuildInfo();

    return () => {
      cancelled = true;
    };
  }, [isInfoOpen]);

  return (
    <>
      <main className="flex h-screen bg-background">
        <aside className="w-64 shrink-0 bg-card border-r border-border shadow-sm flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your store</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {adminTabs
              .filter((item) => !item.disabled)
              .map(({ id, label, icon: Icon }) => (
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

          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setIsInfoOpen(true)}
            >
              <Info className="h-4 w-4" />
              Info
            </Button>
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

        <section className="flex-1 overflow-y-auto bg-muted/30 p-8">{children}</section>
      </main>

      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Build Information</DialogTitle>
            <DialogDescription>
              Snapshot of this running app image/build for debugging.
            </DialogDescription>
          </DialogHeader>

          {isInfoLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading info...
            </div>
          )}

          {infoError && <div className="text-sm text-red-600">Failed: {infoError}</div>}

          {!isInfoLoading && !infoError && buildInfo && (
            <dl className="space-y-2 text-sm">
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">App</dt>
                <dd className="font-mono">{buildInfo.appName}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">Git SHA</dt>
                <dd className="font-mono break-all">{buildInfo.gitSha}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">Git Ref</dt>
                <dd className="font-mono break-all">{buildInfo.gitRef}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">Build Time</dt>
                <dd className="font-mono">{buildInfo.buildTime}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">Image</dt>
                <dd className="font-mono break-all">{buildInfo.imageRef}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">Node Env</dt>
                <dd className="font-mono">{buildInfo.nodeEnv}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <dt className="text-muted-foreground">Checked At</dt>
                <dd className="font-mono">{buildInfo.checkedAt}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
