"use client";

import { useEffect } from "react";

/**
 * KioskBoot
 * Adds `kiosk-portrait` to <html> only when viewport is near 2160×3840 in portrait.
 */
export default function KioskBoot() {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(orientation: portrait)");

    const isNearKioskResolution = () => {
      const portrait = mq.matches;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Tolerance band around 2160×3840 CSS px
      const nearW = w >= 1900 && w <= 2350;
      const nearH = h >= 3300 && h <= 4100;
      return portrait && nearW && nearH;
    };

    const apply = () => {
      let enable = isNearKioskResolution();
      // Allow manual override via query (?kiosk=1) or persisted flag
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("kiosk") === "1") enable = true;
      try {
        const forced = localStorage.getItem("force-kiosk");
        if (forced === "1") enable = true;
      } catch {}
      root.classList.toggle("kiosk-portrait", enable);
      if (enable) {
        root.setAttribute("data-kiosk-home", "1");
      } else {
        root.removeAttribute("data-kiosk-home");
      }
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
