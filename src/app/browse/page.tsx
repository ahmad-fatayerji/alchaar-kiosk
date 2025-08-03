"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryCard from "../../components/CategoryCard";
import Cart from "../../components/Cart";
import { ArrowLeft, Package } from "lucide-react";
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
    router.push("/");
  };

  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId === null) {
      // View All Products
      router.push("/products");
    } else {
      // View specific category
      router.push(`/category/${categoryId}`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            className="text-[#3da874] hover:bg-green-50 hover:text-[#2d7a5f] transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3da874] to-[#2d7a5f] bg-clip-text text-transparent">
              Browse Categories
            </h1>
            <p className="text-gray-500 mt-1">
              Discover products organized by category
            </p>
          </div>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Find exactly what you're looking for
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Browse through our carefully organized categories or view all
            products at once. Each category contains handpicked items to make
            your shopping experience seamless.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-x-6 gap-y-16 max-w-5xl mx-auto">
          {/* View All Card - Always first */}
          <CategoryCard
            id={null}
            name="All Products"
            description="Browse our complete catalog of items across all categories"
            isViewAll={true}
            onClick={handleCategorySelect}
          />

          {/* Category Cards */}
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              description={
                category.hasChildren
                  ? "Contains multiple subcategories to explore"
                  : "Browse products in this category"
              }
              isViewAll={false}
              onClick={handleCategorySelect}
            />
          ))}
        </div>

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No categories yet
              </h3>
              <p className="text-gray-500">
                Categories will appear here once they're added to the system.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-[#3da874] to-[#2d7a5f] text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Need help finding something?
          </h3>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Our intuitive category system makes it easy to find exactly what you
            need. Start with a category or browse all products to discover
            something new.
          </p>
          <Button
            onClick={() => handleCategorySelect(null)}
            className="bg-white text-[#3da874] hover:bg-gray-50 transition-all duration-300 px-8 py-3 text-lg font-semibold"
          >
            View All Products
          </Button>
        </div>
      </div>

      {/* Cart Component */}
      <Cart />
    </div>
  );
}
