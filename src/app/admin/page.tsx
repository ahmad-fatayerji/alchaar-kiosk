"use client";

import { useEffect, useState } from "react";
import { isAuthed } from "@/lib/adminAuth";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => setAuthed(isAuthed()), []);

  return authed ? (
    <AdminDashboard />
  ) : (
    <AdminLogin onSuccess={() => setAuthed(true)} />
  );
}
