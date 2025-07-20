"use client";

import { useEffect, useState } from "react";
import CategoryCard from "../../components/CategoryCard";
import { ArrowLeft } from "lucide-react";
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

  const handleBack = () => {
    window.location.href = "/";
  };

  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId === null) {
      // View All Products
      window.location.href = "/products";
    } else {
      // View specific category
      window.location.href = `/category/${categoryId}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-2xl text-[#3da874]">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            className="text-[#3da874] hover:bg-green-50"
          >
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-[#3da874]">
            Browse Categories
          </h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-12 py-16">
        <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto justify-items-center">
          {/* View All Card - Always first */}
          <CategoryCard
            id={null}
            name="View All Products"
            description="Browse all available products"
            isViewAll={true}
            onClick={handleCategorySelect}
          />

          {/* Category Cards */}
          {categories.map((category) => (
            <div key={category.id} className="relative">
              <CategoryCard
                id={category.id}
                name={category.name}
                description={
                  category.hasChildren
                    ? "Contains subcategories"
                    : "Contains products"
                }
                isViewAll={false}
                onClick={handleCategorySelect}
              />
              {/* Category type indicator */}
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg">
                {category.hasChildren ? (
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    📁
                  </span>
                ) : (
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    📦
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-xl text-gray-500">
              No categories available yet
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
