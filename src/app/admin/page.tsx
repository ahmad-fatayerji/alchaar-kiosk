/* ------------------------------------------------------------------ */
/* /admin route – remembers the last-selected tab                      */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useState } from "react";
import { isAuthed } from "@/lib/adminAuth";
import AdminLogin from "@/components/AdminLogin";
import AdminLayout, { Tab } from "@/components/AdminLayout";
import AdminDashboard from "@/components/AdminDashboard";

/** localStorage key we’ll use */
const TAB_KEY = "admin_active_tab";

export default function AdminPage() {
  /* ---------- auth ---------- */
  const [authed, setAuthed] = useState(false);

  /* ---------- tab state (read once from localStorage) ---------- */
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "categories";
    const stored = localStorage.getItem(TAB_KEY) as Tab | null;
    return stored ?? "categories";
  });

  /* remember tab changes */
  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab);
  }, [tab]);

  /* check auth on mount */
  useEffect(() => setAuthed(isAuthed()), []);

  /* ---------- render ---------- */
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  return (
    <AdminLayout
      tab={tab}
      onTab={(t) => setTab(t)} /* state & localStorage handled above */
    >
      <AdminDashboard tab={tab} />
    </AdminLayout>
  );
}
