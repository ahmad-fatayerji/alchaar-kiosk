"use client";

import { useEffect } from "react";

/**
 * KioskBoot
 * Adds `kiosk-portrait` class to <html> when device is tall portrait
 * so our CSS variables and scaling reliably apply on kiosks.
 * Also supports a dev override via URL/localStorage:
 *   - ?kiosk=1  → force enable
 *   - ?kiosk=0  → disable override
 */
export default function KioskBoot() {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(orientation: portrait)");

    const readOverride = () => {
      const sp = new URLSearchParams(window.location.search);
      const qp = sp.get("kiosk");
      if (qp === "1" || qp === "on" || qp === "true") {
        try {
          localStorage.setItem("kioskForce", "1");
        } catch {}
      } else if (qp === "0" || qp === "off" || qp === "false") {
        try {
          localStorage.removeItem("kioskForce");
        } catch {}
      }
      try {
        return localStorage.getItem("kioskForce") === "1";
      } catch {
        return false;
      }
    };

    const apply = () => {
      const force = readOverride();
      const portrait = mq.matches;
      const h = window.innerHeight;
      const isKiosk = portrait && h >= 1000; // CSS px threshold
      root.classList.toggle("kiosk-portrait", force || isKiosk);
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return null;
}
