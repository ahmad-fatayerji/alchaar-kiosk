"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useThumbVersion } from "@/hooks/useThumbVersion";
import { useI18n } from "@/contexts/LangContext";

type CategoryCardProps = {
  id: number | null;
  name: string;
  description: string;
  isViewAll?: boolean;
  onClick: (categoryId: number | null) => void;
};

export default function CategoryCard({
  id,
  name,
  description,
  isViewAll = false,
  onClick,
}: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const v = useThumbVersion();
  const { t } = useI18n();

  const handleClick = () => {
    onClick(id);
  };

  // Base for multi-extension fallback via /files route
  const base = isViewAll ? null : `/files/categories/${id}`;
  // Prefer modern formats first
  const exts = [".avif", ".webp", ".jpg", ".jpeg", ".png"];

  function fallback(img: HTMLImageElement) {
    // rotate through extensions until one exists; show placeholder if none
    const tried = img.src.split("?")[0];
    const ext = tried.slice(tried.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) {
      img.src = `${base}${next}?v=${v}`;
    } else {
      setImageError(true);
    }
  }

  return (
    <Card
      className="group cursor-pointer w-full aspect-[3/4] mx-auto overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition duration-200"
      onClick={handleClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative flex-1 bg-gray-50 overflow-hidden category-image">
          {isViewAll ? (
            // View All Design
            <div className="absolute inset-0 bg-gradient-to-br from-[#3da874] to-[#2d7a5f] flex items-center justify-center">
              <div className="text-center text-white all-products-logo">
                <ShoppingBag className="all-products-logo-icon h-12 w-12 mx-auto mb-2" />
                <div className="all-products-label text-lg font-semibold">
                  {t("all_products_label")}
                </div>
              </div>
            </div>
          ) : (
            // Category Image with multi-extension fallback (no Next/Image)
            <>
              {!imageError && base ? (
                <img
                  src={`${base}${exts[0]}?v=${v}`}
                  alt={name}
                  onError={(e) => fallback(e.currentTarget)}
                  className="absolute inset-0 h-full w-full object-cover select-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {/* Soft gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 flex-shrink-0 h-32 category-content-height">
          <h3 className="category-title text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {name}
          </h3>
          <p className="category-description text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Action indicator */}
          <div className="category-cta mt-3 text-xs text-[#2d7a5f] font-medium">
            {t("browse")} →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
