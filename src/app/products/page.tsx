"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ProductFilters, { FilterState } from "@/components/ProductFilters";
import Cart from "@/components/Cart";
import OrderSuccess from "@/components/OrderSuccess";
import { useKioskSettings } from "@/hooks/useKioskSettings";
import { useI18n } from "@/contexts/LangContext";

type Product = {
  barcode: string;
  name: string;
  price: string;
  qtyInStock: number;
  categoryId: number | null;
  category?: { id: number; name: string } | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priceMin: 0,
    priceMax: 1000,
    availability: "all",
    sortBy: "name",
  });

  const { hidePrices, showQuantities } = useKioskSettings();
  const { t } = useI18n();

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 1000;
    return Math.ceil(Math.max(...products.map((p) => Number(p.price))));
  }, [products]);

  // Update price filter when maxPrice changes
  useEffect(() => {
    if (maxPrice !== filters.priceMax && filters.priceMax === 1000) {
      setFilters((prev) => ({ ...prev, priceMax: maxPrice }));
    }
  }, [maxPrice, filters.priceMax]);

  useEffect(() => {
    // Fetch all products (exclude uncategorized so kiosk only shows assigned items)
    fetch("/api/products?excludeUncategorized=1")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setLoading(false);
      });
  }, []);

  // Normalize filters based on settings
  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      if (hidePrices) {
        next.priceMin = 0;
        next.priceMax = Math.max(next.priceMax, maxPrice);
        if (next.sortBy === "price-low" || next.sortBy === "price-high") {
          next.sortBy = "name";
        }
      }
      if (!showQuantities) {
        if (next.availability !== "all") next.availability = "all";
        if (next.sortBy === "stock") next.sortBy = "name";
      }
      return next;
    });
  }, [hidePrices, showQuantities, maxPrice]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Search filter
      if (
        filters.search &&
        !product.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Price filter
      if (!hidePrices) {
        const price = Number(product.price);
        if (price < filters.priceMin || price > filters.priceMax) {
          return false;
        }
      }

      // Availability filter
      if (showQuantities) {
        if (filters.availability === "in-stock" && product.qtyInStock <= 0) {
          return false;
        }
        if (filters.availability === "out-of-stock" && product.qtyInStock > 0) {
          return false;
        }
      }

      return true;
    });

    // Sort products
    switch (filters.sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-low":
        if (!hidePrices)
          filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-high":
        if (!hidePrices)
          filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "stock":
        if (showQuantities)
          filtered.sort((a, b) => b.qtyInStock - a.qtyInStock);
        break;
    }

    return filtered;
  }, [products, filters, hidePrices, showQuantities]);

  const handleBack = () => {
    window.location.href = "/browse";
  };

  const handleProductClick = (product: Product) => {
    // Handle product selection - could open a detail view, add to cart, etc.
    console.log("Product clicked:", product);
  };

  const handleCheckout = (orderNum: string) => {
    setOrderNumber(orderNum);
  };

  const handleReturnHome = () => {
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-2xl text-[#3da874]">Loading products...</div>
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
            {t("back_to_categories")}
          </Button>
          <h1 className="text-3xl font-bold text-[#3da874]">
            {t("all_products")}
          </h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          productCount={filteredProducts.length}
          maxPrice={maxPrice}
        />

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-6 gap-y-16 max-w-5xl mx-auto">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.barcode}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-2xl text-gray-700 mb-4">No products found</div>
            <div className="text-lg text-gray-500">
              {products.length === 0
                ? "No products available"
                : "Try adjusting your filters to see more products"}
            </div>
          </div>
        )}
      </div>

      {/* Cart Component */}
      <Cart onCheckout={handleCheckout} />

      {/* Order Success Modal */}
      {orderNumber && (
        <OrderSuccess orderNumber={orderNumber} onReturn={handleReturnHome} />
      )}
    </div>
  );
}
