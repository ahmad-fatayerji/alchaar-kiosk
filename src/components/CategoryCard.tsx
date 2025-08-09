"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useThumbVersion } from "@/hooks/useThumbVersion";

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

  const handleClick = () => {
    onClick(id);
  };

  // Base for multi-extension fallback via /files route
  const base = isViewAll ? null : `/files/categories/${id}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

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
      className="group cursor-pointer w-full aspect-[3/4] max-w-[280px] mx-auto overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 rounded-xl"
      onClick={handleClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative flex-1 bg-gray-100 overflow-hidden">
          {isViewAll ? (
            // View All Design
            <div className="absolute inset-0 bg-gradient-to-br from-[#3da874] to-[#2d7a5f] flex items-center justify-center">
              <div className="text-center text-white">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2" />
                <div className="text-lg font-semibold">All Products</div>
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
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#3da874] transition-colors duration-200 line-clamp-2">
            {name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Action indicator */}
          <div className="mt-3 text-xs text-[#3da874] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Browse →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
