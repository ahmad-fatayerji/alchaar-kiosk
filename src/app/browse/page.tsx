"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/contexts/LangContext";
import { useKioskSettings } from "@/hooks/useKioskSettings";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import CategoryCard from "../../components/CategoryCard";
import Cart from "../../components/Cart";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = {
  id: number;
  name: string;
  slug: string;
  hasChildren: boolean;
};

export default function BrowsePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const { idleTimeoutSeconds } = useKioskSettings();

  useIdleTimeout({
    timeoutMs: idleTimeoutSeconds * 1000,
    enabled: idleTimeoutSeconds > 0,
    onTimeout: () => {
      window.location.href = "/browse";
    },
  });

  useEffect(() => {
    // Fetch root categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray((data as any)?.categories)) {
          setCategories((data as any).categories);
        } else {
          console.warn("/api/categories returned unexpected shape", data);
          setCategories([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setLoading(false);
      });
    // Ensure cart starts closed when entering browse fresh
    try {
      const saved = localStorage.getItem("kiosk-cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isOpen) {
          parsed.isOpen = false;
          localStorage.setItem("kiosk-cart", JSON.stringify(parsed));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId === null) {
      // View All Products
      router.push("/products");
    } else {
      // View specific category
      router.push(`/category/${categoryId}`);
    }
  };

  const handleCheckout = (orderNum: string) => {
    // Handle successful checkout - you could show a success message or redirect
    console.log("Order created:", orderNum);
    // Optionally redirect to order confirmation or stay on page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-2xl text-[#3da874]">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="kiosk-viewport browse-page relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex flex-col">
      <div className="browse-top-logo-wrap pointer-events-none" aria-hidden>
        <Image
          src="/logo.svg"
          alt=""
          width={560}
          height={220}
          priority
          className="browse-top-logo object-contain"
        />
      </div>

      <div className="flex-grow">
        <div className="container mx-auto px-6 pt-6 pb-2 kiosk-text">
          <div className="flex items-center justify-between gap-4">
            <Image
              src="/logo.svg"
              alt="Al-Chaar Pharmacy logo"
              width={220}
              height={88}
              priority
              className="browse-inline-logo h-14 w-auto object-contain"
            />
          </div>
        </div>

        {/* Hero Section (original positioning) */}
        <div className="container mx-auto px-6 py-8 text-center kiosk-text">
          <div className="w-full grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div />
            <h2 className="kiosk-title text-3xl font-bold text-gray-800 mb-4">
              {t("browse_subcategories")}
            </h2>
            <div className="justify-self-end flex items-center gap-2">
              {(["en", "ar"] as const).map((code) => (
                <button
                  key={code}
                  aria-label={code === "en" ? "English" : "Arabic"}
                  aria-pressed={lang === code}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLang(code);
                  }}
                  className={`px-3 h-10 rounded-xl border-2 font-semibold tracking-wide transition-colors text-sm kiosk-portrait:h-[5.8rem] kiosk-portrait:text-[1.8rem] kiosk-portrait:px-7 kiosk-portrait:rounded-[1.6rem] ${
                    lang === code
                      ? "bg-[#3da874] text-white border-[#3da874] shadow"
                      : "bg-white text-[#3da874] border-[#3da874] hover:bg-green-50"
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 leading-relaxed text-lg -mt-1">
              {t("select_category")}
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-6 pb-16 kiosk-text">
          <div className="grid kiosk-cols-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 sm:gap-x-10 sm:gap-y-14 mx-auto">
            {/* View All Card - Always first */}
            <CategoryCard
              id={null}
              name={t("all_products")}
              description={t("all_products_desc")}
              isViewAll={true}
              onClick={handleCategorySelect}
            />

            {/* Category Cards */}
            {Array.isArray(categories) &&
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  id={category.id}
                  name={
                    lang === "ar" && (category as any).arabicName
                      ? (category as any).arabicName
                      : category.name
                  }
                  description={
                    category.hasChildren
                      ? t("category_has_children_desc")
                      : t("category_browse_desc")
                  }
                  isViewAll={false}
                  onClick={handleCategorySelect}
                />
              ))}
          </div>

          {/* Empty state */}
          {categories.length === 0 && (
            <div className="text-center py-16 kiosk-text">
              <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {t("browse")}
                </h3>
                <p className="text-gray-500">{t("select_category")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA pinned to bottom (original height, just lowered) */}
      <div className="mt-auto bg-gradient-to-r from-[#3da874] to-[#2d7a5f] text-white py-8 kiosk-text kiosk-footer-floor">
        <div className="container mx-auto px-6 text-center">
          <h3 className="footer-cta-title text-2xl font-bold mb-4">
            {t("need_help_title")}
          </h3>
          <p className="footer-cta-desc text-green-100 mb-6 max-w-2xl mx-auto">
            {t("need_help_desc")}
          </p>
          <Button
            onClick={() => handleCategorySelect(null)}
            className="kiosk-button footer-cta-button bg-white text-[#3da874] hover:bg-gray-50 transition-all duration-300 px-8 py-3 text-lg font-semibold"
          >
            {t("view_all_products_btn")}
          </Button>
        </div>
      </div>

      {/* Cart Component */}
      <Cart onCheckout={handleCheckout} />
    </div>
  );
}
