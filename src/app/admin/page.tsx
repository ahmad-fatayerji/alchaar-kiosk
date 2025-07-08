"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { isAuthed } from "@/lib/adminAuth";
import AdminLogin from "@/components/AdminLogin";
import AdminLayout, { Tab } from "@/components/AdminLayout";
import CategoriesPanel from "@/components/CategoriesPanel";
import FiltersPanel from "@/components/FiltersPanel";

/* optional stub until 3·3 is built */
function ProductsPanel() {
  return <p>📦 Products CRUD coming soon…</p>;
}

const PANELS: Record<Tab, () => ReactElement> = {
  categories: CategoriesPanel,
  filters: FiltersPanel,
  products: ProductsPanel,
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("categories");

  useEffect(() => setAuthed(isAuthed()), []);

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  const Panel = PANELS[tab];
  return (
    <AdminLayout tab={tab} onTab={setTab}>
      <Panel />
    </AdminLayout>
  );
}
