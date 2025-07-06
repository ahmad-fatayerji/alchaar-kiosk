// src/app/admin/page.tsx
"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Admin Dashboard</h1>

      <ul className="flex flex-col gap-2">
        <li>
          <Link href="/admin/categories">Manage Categories</Link>
        </li>
        <li>
          <Link href="/admin/filters">Manage Filters</Link>
        </li>
        <li>
          <Link href="/admin/products">Manage Products</Link>
        </li>
        {/* add more links as features appear */}
      </ul>

      {/*  no logout button – just reload the tab if you need to lock again */}
    </main>
  );
}
