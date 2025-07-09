"use client";

import CategoriesPanel from "@/components/CategoriesPanel";
import FiltersPanel from "@/components/FiltersPanel";
import ProductsPanel from "@/components/ProductsPanel";
import type { Tab } from "./AdminLayout";

export default function AdminDashboard({ tab }: { tab: Tab }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      {tab === "categories" && <CategoriesPanel />}
      {tab === "filters" && <FiltersPanel />}
      {tab === "products" && <ProductsPanel />}
    </div>
  );
}
