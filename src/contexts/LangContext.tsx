"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dict } from "@/lib/i18n";
import { usePathname } from "next/navigation";

export type Lang = "en" | "ar";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (
    key: keyof typeof dict.en,
    vars?: Record<string, string | number>
  ) => string;
};

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const pathname =
    usePathname?.() ??
    (typeof window !== "undefined" ? window.location.pathname : "/");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      localStorage.getItem("lang")) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  // Apply dir/lang at the document level, but only for shopper routes
  // Admin (/admin) and Orders (/orders, /order) must always remain LTR
  useEffect(() => {
    if (typeof document === "undefined") return;
    const path =
      pathname ||
      (typeof window !== "undefined" ? window.location.pathname : "/");
    const isAdminOrOrders =
      path.startsWith("/admin") ||
      path.startsWith("/orders") ||
      path.startsWith("/order");
    const effectiveLang: Lang = isAdminOrOrders ? "en" : lang;
    const dir = isAdminOrOrders
      ? "ltr"
      : effectiveLang === "ar"
      ? "rtl"
      : "ltr";

    document.documentElement.setAttribute("lang", effectiveLang);
    document.documentElement.setAttribute("dir", dir);
  }, [lang, pathname]);

  const t = useMemo(() => {
    return (
      key: keyof typeof dict.en,
      vars?: Record<string, string | number>
    ) => {
      const value = (dict as any)[lang]?.[key] ?? dict.en[key] ?? key;
      if (!vars) return value as string;
      return Object.keys(vars).reduce(
        (acc, k) => acc.replaceAll(`{${k}}`, String(vars[k]!)),
        value as string
      );
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
