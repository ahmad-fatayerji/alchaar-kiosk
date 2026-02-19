"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ProductFilters, { FilterState } from "@/components/ProductFilters";
import CategoryCard from "@/components/CategoryCard";
import Cart from "@/components/Cart";
import OrderSuccess from "@/components/OrderSuccess";
import { useI18n } from "@/contexts/LangContext";
import { useKioskSettings } from "@/hooks/useKioskSettings";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

type Category = {
  id: number;
  name: string;
  arabicName?: string | null;
  slug: string;
  parentId?: number | null;
  hasChildren?: boolean;
  children?: Category[];
};

type Product = {
  barcode: string;
  name: string;
  price: string;
  qtyInStock: number;
  categoryId: number | null;
  category?: { id: number; name: string } | null;
};

// Helper function to find category by ID recursively
function findCategoryById(
  categories: Category[],
  targetId: number
): Category | null {
  for (const category of categories) {
    if (category.id === targetId) {
      return category;
    }
    if (category.children) {
      const found = findCategoryById(category.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [parentPath, setParentPath] = useState<
    { id: number; name: string; arabicName?: string | null }[]
  >([]);
  const { t, lang, setLang } = useI18n();
  const isArabic = lang === "ar";
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priceMin: 0,
    priceMax: 1000,
    availability: "all",
    sortBy: "name",
  });
  const { hidePrices, showQuantities, idleTimeoutSeconds } = useKioskSettings();

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
    if (categoryId) {
      Promise.all([
        // Fetch category details and check if it has children
        fetch(`/api/categories/${categoryId}`)
          .then((res) => res.json())
          .then((children) => {
            // If this API returns children, it's not a leaf category
            const hasChildren = children.length > 0;
            setSubcategories(children);
            setIsLeafCategory(!hasChildren);
            return hasChildren;
          }),
        // Get the category info (includes parent path)
        fetch(`/api/categories/${categoryId}/info`)
          .then((res) => res.json())
          .then((categoryInfo) => categoryInfo),
      ])
        .then(([hasChildren, categoryInfo]) => {
          setCategory(categoryInfo);

          // Build parent path for breadcrumbs
          const buildParentPath = async (): Promise<
            { id: number; name: string; arabicName?: string | null }[]
          > => {
            const path: { id: number; name: string; arabicName?: string | null }[] = [];
            let currentCat = categoryInfo;

            while (currentCat && currentCat.parentId) {
              try {
                const parent = await fetch(
                  `/api/categories/${currentCat.parentId}/info`
                ).then((r) => r.json());
                path.unshift({
                  id: parent.id,
                  name: parent.name,
                  arabicName: parent.arabicName,
                });
                currentCat = parent;
              } catch {
                break;
              }
            }

            return path;
          };

          buildParentPath().then(setParentPath);

          // Only fetch products if this is a leaf category (no children)
          if (!hasChildren) {
            fetch(
              `/api/products?cat=${categoryId}&includeArchived=false&excludeUncategorized=1`
            )
              .then((res) => res.json())
              .then((productsData) => {
                setProducts(productsData);
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load category:", err);
          setLoading(false);
        });
    }
  }, [categoryId]);

  // Normalize filters if certain controls are disabled by settings
  useEffect(() => {
    setFilters((prev) => {
      let next = { ...prev };
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
    // If we have a parent, go to the parent category, otherwise go to browse
    if (parentPath.length > 0) {
      const parentId = parentPath[parentPath.length - 1].id;
      window.location.href = `/category/${parentId}`;
    } else {
      window.location.href = "/browse";
    }
  };

  const handleBreadcrumbClick = (categoryId: number | null) => {
    if (categoryId === null) {
      window.location.href = "/browse";
    } else {
      window.location.href = `/category/${categoryId}`;
    }
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

  const handleSubcategoryClick = (subcategoryId: number | null) => {
    if (subcategoryId) {
      window.location.href = `/category/${subcategoryId}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-2xl text-[#3da874]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="products-page kiosk-viewport min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-green-200 kiosk-header-static">
        <div className="container mx-auto px-4 py-3 kiosk-text kiosk-portrait:py-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex items-center gap-4 min-w-0 justify-self-start">
              <Button
                variant="ghost"
                size="lg"
                onClick={handleBack}
                className="kiosk-button text-[#3da874] hover:bg-green-50 px-4 py-3 text-xl font-semibold max-w-full kiosk-portrait:text-[2.4rem] kiosk-portrait:px-8 kiosk-portrait:py-8"
              >
                <ArrowLeft
                  className={`${isArabic ? "ml-3 rotate-180" : "mr-3"} h-8 w-8 shrink-0 kiosk-portrait:h-16 kiosk-portrait:w-16`}
                />
                <span className="leading-none truncate">
                  {parentPath.length > 0 ? t("back") : t("back_to_categories")}
                </span>
              </Button>
            </div>
            <h1 className="kiosk-title text-3xl font-bold text-[#3da874] kiosk-portrait:text-[4rem] text-center truncate min-w-0 px-2">
              {isArabic && category?.arabicName
                ? category.arabicName
                : category?.name || `Category ${categoryId}`}
            </h1>
            <div className="flex items-center gap-3 justify-self-end">
              {(["en", "ar"] as const).map((code) => (
                <button
                  key={code}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLang(code);
                  }}
                  className={`px-3 h-10 rounded-xl border-2 font-semibold tracking-wide transition-colors text-sm kiosk-portrait:h-[5.8rem] kiosk-portrait:text-[1.8rem] kiosk-portrait:px-7 kiosk-portrait:rounded-[1.6rem] ${
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
          {/* Breadcrumb */}
          {parentPath.length > 0 && (
            <div className="flex items-center justify-center text-sm text-gray-600 mt-4 kiosk-portrait:text-[1.6rem]">
              <button
                onClick={() => handleBreadcrumbClick(null)}
                className="hover:text-[#3da874] transition-colors"
              >
                <bdi>{t("browse")}</bdi>
              </button>
              {parentPath.map((parent) => (
                <span key={parent.id} className="flex items-center">
                  <span className="mx-2" aria-hidden>
                    {isArabic ? "<-" : "->"}
                  </span>
                  <button
                    onClick={() => handleBreadcrumbClick(parent.id)}
                    className="hover:text-[#3da874] transition-colors"
                  >
                    <bdi>
                      {isArabic && parent.arabicName ? parent.arabicName : parent.name}
                    </bdi>
                  </button>
                </span>
              ))}
              <span className="mx-2" aria-hidden>
                {isArabic ? "<-" : "->"}
              </span>
              <span className="text-[#3da874] font-medium">
                <bdi>
                  {isArabic && category?.arabicName
                    ? category.arabicName
                    : category?.name}
                </bdi>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 kiosk-text">
        {!isLeafCategory ? (
          /* Show subcategories if this is not a leaf category */
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                {t("browse_subcategories")}
              </h2>
              <p className="text-gray-500">{t("select_category")}</p>
            </div>

            {subcategories.length > 0 ? (
              <div className="grid kiosk-cols-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 sm:gap-x-10 sm:gap-y-14 mx-auto">
                {subcategories.map((subcategory) => (
                  <CategoryCard
                    key={subcategory.id}
                    id={subcategory.id}
                    name={
                      lang === "ar" && (subcategory as any).arabicName
                        ? (subcategory as any).arabicName
                        : subcategory.name
                    }
                    description={
                      subcategory.hasChildren
                        ? t("category_has_children_desc")
                        : t("category_browse_desc")
                    }
                    onClick={handleSubcategoryClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-2xl text-gray-700 mb-4">
                  No subcategories found
                </div>
                <div className="text-lg text-gray-500">
                  This category has no subcategories available
                </div>
              </div>
            )}
          </>
        ) : (
          /* Show products if this is a leaf category */
          <>
            {/* Filters */}
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              productCount={filteredProducts.length}
              maxPrice={maxPrice}
            />

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid kiosk-cols-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 sm:gap-x-10 sm:gap-y-14 mx-auto">
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
                <div className="text-2xl text-gray-700 mb-4">
                  No products found
                </div>
                <div className="text-lg text-gray-500">
                  {products.length === 0
                    ? `No products available in ${category?.name} category`
                    : "Try adjusting your filters to see more products"}
                </div>
              </div>
            )}
          </>
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

