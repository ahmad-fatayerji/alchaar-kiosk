"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/LangContext";
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
  const { t, lang } = useI18n();

  useEffect(() => {
    // Fetch root categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setLoading(false);
      });
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
    <div className="kiosk-viewport min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12 text-center kiosk-text">
        <div className="max-w-2xl mx-auto">
          <h2 className="kiosk-title text-3xl font-bold text-gray-800 mb-4">
            {t("browse_subcategories")}
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">
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
          {categories.map((category) => (
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

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-[#3da874] to-[#2d7a5f] text-white py-12 kiosk-text">
        <div className="container mx-auto px-6 text-center">
          <h3 className="footer-cta-title text-2xl font-bold mb-4">{t("need_help_title")}</h3>
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
