"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CategoriesPanel from "@/components/CategoriesPanel";
import FiltersPanel from "@/components/FiltersPanel";

/* stub until product CRUD is ready */
function ProductsPanel() {
  return (
    <p className="text-sm text-muted-foreground">Product CRUD coming soon…</p>
  );
}

export default function AdminDashboard() {
  const [active, setActive] = useState<"categories" | "filters" | "products">(
    "categories"
  );

  const col = "flex flex-col gap-4 h-full overflow-hidden";

  return (
    <main className="grid h-screen grid-cols-3 gap-6 bg-muted p-6">
      {/* Categories */}
      <Card
        className={col}
        onClick={() => setActive("categories")}
        data-active={active === "categories"}
      >
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-y-auto px-0">
          <CategoriesPanel />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card
        className={col}
        onClick={() => setActive("filters")}
        data-active={active === "filters"}
      >
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-y-auto px-0">
          <FiltersPanel />
        </CardContent>
      </Card>

      {/* Products */}
      <Card
        className={col}
        onClick={() => setActive("products")}
        data-active={active === "products"}
      >
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-y-auto px-0">
          <ProductsPanel />
        </CardContent>
      </Card>
    </main>
  );
}
