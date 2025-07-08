"use client";

import { useState } from "react";
import { login } from "@/lib/adminAuth";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (login(pwd)) {
      onSuccess();
    } else {
      setErr("Wrong password");
      setPwd("");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center">
      <div className="flex w-80 flex-col gap-4">
        <h1 className="text-center text-2xl font-semibold">Admin Login</h1>

        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Password"
          className="rounded border px-3 py-2"
        />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          onClick={submit}
          disabled={!pwd}
          className="rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50"
        >
          Enter
        </button>
      </div>
    </main>
  );
}
