"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { usePathname, useRouter } from "next/navigation";

/*
 * InactivityReset
 * Listens for user interaction (pointer/keyboard/touch) and if no interaction
 * occurs for IDLE_MS, resets the cart and returns user to home page.
 * Skips behavior on /admin routes and /orders (admin management pages).
 */
const DEFAULT_IDLE_MS = 60_000; // fallback

export default function InactivityReset() {
  const { clearCart, setCartOpen } = useCart();
  const [idleMs, setIdleMs] = useState<number>(DEFAULT_IDLE_MS);
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // pages to ignore inactivity (admin UI / order management)
  const disabled =
    pathname.startsWith("/admin") || pathname.startsWith("/orders");

  // Load / refresh inactivity timeout setting + poll every 2 minutes
  useEffect(() => {
    let active = true;
    let pollTimer: NodeJS.Timeout | null = null;

    const load = () => {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          const ms = Number(
            data.inactivity_timeout_ms ||
              data.INACTIVITY_TIMEOUT_MS ||
              DEFAULT_IDLE_MS
          );
          if (!Number.isNaN(ms) && ms > 0 && ms < 1000 * 60 * 30) {
            setIdleMs(ms);
          }
        })
        .catch(() => {});
    };

    load();
    pollTimer = setInterval(load, 120_000); // 2 min

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pathname]);

  useEffect(() => {
    if (disabled) {
      // If entering a disabled area, clear any existing timers.
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Only act if still on a kiosk browsing / product page (not admin)
        if (!disabled) {
          clearCart();
          setCartOpen(false);
          // Navigate home unless already there
          if (pathname !== "/") router.push("/");
        }
      }, idleMs);
    }

    // Initial start
    resetTimer();

    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
      "touchmove",
    ];
    events.forEach((ev) =>
      window.addEventListener(ev, resetTimer, { passive: true })
    );

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, disabled, clearCart, router, setCartOpen, idleMs]);

  return null; // headless utility
}
