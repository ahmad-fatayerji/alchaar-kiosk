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

type Category = {
  id: number;
  name: string;
  slug: string;
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
  const [parentPath, setParentPath] = useState<{ id: number; name: string }[]>(
    []
  );
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priceMin: 0,
    priceMax: 1000,
    availability: "all",
    sortBy: "name",
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
          const buildParentPath = async (
            catId: number
          ): Promise<{ id: number; name: string }[]> => {
            const path: { id: number; name: string }[] = [];
            let currentCat = categoryInfo;

            while (currentCat && currentCat.parentId) {
              try {
                const parent = await fetch(
                  `/api/categories/${currentCat.parentId}/info`
                ).then((r) => r.json());
                path.unshift({ id: parent.id, name: parent.name });
                currentCat = parent;
              } catch {
                break;
              }
            }

            return path;
          };

          buildParentPath(parseInt(categoryId)).then(setParentPath);

          // Only fetch products if this is a leaf category (no children)
          if (!hasChildren) {
            fetch(`/api/products?categoryId=${categoryId}`)
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
      const price = Number(product.price);
      if (price < filters.priceMin || price > filters.priceMax) {
        return false;
      }

      // Availability filter
      if (filters.availability === "in-stock" && product.qtyInStock <= 0) {
        return false;
      }
      if (filters.availability === "out-of-stock" && product.qtyInStock > 0) {
        return false;
      }

      return true;
    });

    // Sort products
    switch (filters.sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-low":
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "stock":
        filtered.sort((a, b) => b.qtyInStock - a.qtyInStock);
        break;
    }

    return filtered;
  }, [products, filters]);

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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          {/* Navigation Row */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBack}
              className="text-[#3da874] hover:bg-green-50"
            >
              <ArrowLeft className="mr-2 h-6 w-6" />
              {parentPath.length > 0 ? "Back" : "Back to Categories"}
            </Button>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>

          {/* Breadcrumb and Title */}
          <div className="text-center">
            {/* Breadcrumb */}
            {parentPath.length > 0 && (
              <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
                <button
                  onClick={() => handleBreadcrumbClick(null)}
                  className="hover:text-[#3da874] transition-colors"
                >
                  Browse
                </button>
                {parentPath.map((parent, index) => (
                  <span key={parent.id} className="flex items-center">
                    <span className="mx-2">→</span>
                    <button
                      onClick={() => handleBreadcrumbClick(parent.id)}
                      className="hover:text-[#3da874] transition-colors"
                    >
                      {parent.name}
                    </button>
                  </span>
                ))}
                <span className="mx-2">→</span>
                <span className="text-[#3da874] font-medium">
                  {category?.name}
                </span>
              </div>
            )}

            {/* Category Title */}
            <h1 className="text-3xl font-bold text-[#3da874]">
              {category?.name || `Category ${categoryId}`}
            </h1>

            {/* Category Type Badge */}
            <div className="mt-2 flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isLeafCategory
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {isLeafCategory ? "📦 Product Category" : "📁 Category Group"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {!isLeafCategory ? (
          /* Show subcategories if this is not a leaf category */
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Browse Subcategories
              </h2>
              <p className="text-gray-500">
                Select a category to view products
              </p>
            </div>

            {subcategories.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-8 gap-y-32 max-w-5xl mx-auto">
                {subcategories.map((subcategory) => (
                  <CategoryCard
                    key={subcategory.id}
                    id={subcategory.id}
                    name={subcategory.name}
                    description={
                      subcategory.hasChildren
                        ? "Contains subcategories"
                        : "Contains products"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
