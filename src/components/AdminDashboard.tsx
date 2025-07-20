"use client";

import CategoriesPanel from "@/components/CategoriesPanel";
import FiltersPanel from "@/components/FiltersPanel";
import ProductsPanel from "@/components/ProductsPanel";
import type { Tab } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboard({ tab }: { tab: Tab }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8">
      {tab === "categories" && <CategoriesPanel />}
      {tab === "filters" && <FiltersPanel />}
      {tab === "products" && <ProductsPanel />}
      </CardContent>
    </Card>
  );
}
