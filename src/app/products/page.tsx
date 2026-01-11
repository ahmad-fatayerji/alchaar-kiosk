"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ProductFilters, { FilterState } from "@/components/ProductFilters";
import Cart from "@/components/Cart";
import OrderSuccess from "@/components/OrderSuccess";
import { useKioskSettings } from "@/hooks/useKioskSettings";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
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

  const { hidePrices, showQuantities, idleTimeoutSeconds } = useKioskSettings();
  const { t, lang, setLang } = useI18n();

  useIdleTimeout({
    timeoutMs: idleTimeoutSeconds * 1000,
    enabled: idleTimeoutSeconds > 0,
    onTimeout: () => {
      window.location.href = "/";
    },
  });

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
    <div className="products-page kiosk-viewport min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-green-200 kiosk-header-static">
        <div className="container mx-auto px-4 py-3 kiosk-text kiosk-portrait:py-6 products-header-bar relative flex items-center">
          {/* Back button (left) */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBack}
              className="kiosk-button products-back-button text-[#3da874] hover:bg-green-50 px-5 py-3 text-xl font-semibold kiosk-portrait:text-[2.8rem] kiosk-portrait:px-12 kiosk-portrait:py-10"
            >
              <ArrowLeft className="mr-3 h-8 w-8 kiosk-portrait:h-20 kiosk-portrait:w-20" />
              <span className="leading-none kiosk-portrait:text-[2.8rem]">
                {t("back_to_categories")}
              </span>
            </Button>
          </div>
          {/* Centered title absolute to remain centered regardless of side widths */}
          <h1 className="kiosk-title text-3xl font-bold text-[#3da874] kiosk-portrait:text-[4.5rem] absolute left-1/2 -translate-x-1/2 pointer-events-none">
            {t("all_products")}
          </h1>
          {/* Right language toggle (kiosk only visible here) */}
          <div className="ml-auto flex items-center gap-3">
            {(["en", "ar"] as const).map((code) => (
              <button
                key={code}
                onClick={(e) => {
                  e.stopPropagation();
                  setLang(code);
                }}
                className={`px-3 h-10 rounded-xl border-2 font-semibold tracking-wide transition-colors text-sm kiosk-portrait:h-[7rem] kiosk-portrait:text-[2.2rem] kiosk-portrait:px-10 kiosk-portrait:rounded-[2rem] ${
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
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 kiosk-text">
        {/* Filters */}
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          productCount={filteredProducts.length}
          maxPrice={maxPrice}
        />

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid kiosk-cols-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-14 mx-auto">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.barcode}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 kiosk-text">
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
