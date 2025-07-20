"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const handleBack = () => {
    window.location.href = "/browse";
  };

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
          <h1 className="text-3xl font-bold text-[#3da874]">All Products</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-16">
          <div className="text-2xl text-gray-700 mb-4">All Products View</div>
          <div className="text-lg text-gray-500">
            This page will display all products from all categories
          </div>
        </div>
      </div>
    </div>
  );
}
