"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = {
  id: number;
  name: string;
  slug: string;
};

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      // Fetch category details
      fetch(`/api/categories/${categoryId}`)
        .then((res) => res.json())
        .then((data) => {
          setCategory(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load category:", err);
          setLoading(false);
        });
    }
  }, [categoryId]);

  const handleBack = () => {
    window.location.href = "/browse";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-2xl text-[#3da874]">Loading category...</div>
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
            Back to Categories
          </Button>
          <h1 className="text-3xl font-bold text-[#3da874]">
            {category?.name || `Category ${categoryId}`}
          </h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-16">
          <div className="text-2xl text-gray-700 mb-4">
            {category?.name} Products
          </div>
          <div className="text-lg text-gray-500">
            This page will display products from the {category?.name} category
          </div>
        </div>
      </div>
    </div>
  );
}
