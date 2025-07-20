"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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

  const handleClick = () => {
    onClick(id);
  };

  // Determine image source
  const imageSrc = isViewAll ? null : `/categories/${id}.avif`;

  return (
    <div
      className="flex flex-col items-center group cursor-pointer"
      onClick={handleClick}
    >
      {/* Square Card */}
      <div className="relative w-48 h-48 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-lg border-4 border-white group-hover:border-[#3da874] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-[#3da874]/10 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-[#3da874]/20 rounded-full"></div>

        {/* Image/Icon Section */}
        <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center overflow-hidden">
          {isViewAll ? (
            // View All icon
            <div className="flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-6 shadow-lg">
                <ShoppingBag className="h-16 w-16 text-[#3da874]" />
              </div>
            </div>
          ) : (
            // Category image or fallback
            <>
              {!imageError && imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-6 shadow-lg">
                    <Package className="h-16 w-16 text-[#3da874]" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-2xl" />
        </div>

        {/* Floating action indicator */}
        <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#3da874] rounded-full flex items-center justify-center text-white group-hover:bg-[#2d7a5f] transition-all duration-300 group-hover:scale-110 shadow-lg">
          <span className="text-lg font-bold">→</span>
        </div>
      </div>

      {/* Category Name */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#3da874] transition-colors duration-300 leading-tight">
          {name}
        </h3>
        <div className="mt-2 h-1 w-12 bg-[#3da874]/30 rounded-full mx-auto group-hover:bg-[#3da874] transition-all duration-300"></div>
      </div>
    </div>
  );
}
