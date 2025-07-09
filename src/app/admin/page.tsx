"use client";

import { useEffect, useState } from "react";
import { isAuthed } from "@/lib/adminAuth";
import AdminLogin from "@/components/AdminLogin";
import AdminLayout, { Tab } from "@/components/AdminLayout";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("categories");

  useEffect(() => setAuthed(isAuthed()), []);

  return authed ? (
    <AdminLayout tab={tab} onTab={setTab}>
      <AdminDashboard tab={tab} />
    </AdminLayout>
  ) : (
    <AdminLogin onSuccess={() => setAuthed(true)} />
  );
}
