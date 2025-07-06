// app/admin/layout.tsx
"use client";

import { useState } from "react";

const PASS = process.env.NEXT_PUBLIC_ADMIN_PASS ?? "";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");

  if (!authed) {
    return (
      <main style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input === PASS) setAuthed(true);
            else alert("Wrong password");
          }}
        >
          <label>
            Admin password:
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>
          <button type="submit" style={{ marginLeft: 8 }}>
            Enter
          </button>
        </form>
      </main>
    );
  }

  // ✔️ Password was correct → show real admin pages
  return <>{children}</>;
}
