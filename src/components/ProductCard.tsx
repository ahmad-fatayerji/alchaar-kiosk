"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Package, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

type Product = {
  barcode: string;
  name: string;
  price: string;
  salePrice?: string | null;
  qtyInStock: number;
  categoryId: number | null;
  category?: { id: number; name: string } | null;
};

type ProductCardProps = {
  product: Product;
  onClick?: (product: Product) => void;
  hidePrices?: boolean; // For admin override
};

export default function ProductCard({
  product,
  onClick,
  hidePrices: hidePricesOverride,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [hidePrices, setHidePrices] = useState(false);
  const [salesEnabled, setSalesEnabled] = useState(true);
  const { addItem } = useCart();
  const isInStock = product.qtyInStock > 0;
  const imageSrc = `/products/${product.barcode}.avif`;
  const hasSale =
    salesEnabled && product.salePrice && Number(product.salePrice) > 0;
  const regularPrice = Number(product.price);
  const salePrice = hasSale ? Number(product.salePrice) : null;

  // Load settings
  useEffect(() => {
    if (hidePricesOverride !== undefined) {
      setHidePrices(hidePricesOverride);
    } else {
      // Only fetch settings if no override is provided
      fetch("/api/settings")
        .then((res) => res.json())
        .then((settings) => {
          setHidePrices(settings.hide_prices === "true");
          setSalesEnabled(settings.sales_enabled !== "false");
        })
        .catch(() => {
          setHidePrices(false);
          setSalesEnabled(true);
        });
    }
  }, [hidePricesOverride]); // Depend on hidePricesOverride

  const handleClick = () => {
    // Only handle click for non-interactive elements (like opening product details)
    // Don't add to cart from card click to prevent double-adding
    onClick?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent any default behavior

    if (!isInStock) {
      return;
    }

    console.log("🔴 ProductCard: About to call addItem", {
      barcode: product.barcode,
      name: product.name,
      timestamp: new Date().toISOString(),
    });

    addItem({
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
    });

    console.log("🔴 ProductCard: addItem call completed for", product.barcode);
  };

  return (
    <Card
      className={`group transition-all duration-200 hover:shadow-2xl border border-gray-200 hover:border-[#3da874] bg-white rounded-lg overflow-hidden w-64 h-72 flex flex-col relative ${
        !isInStock ? "opacity-60" : ""
      }`}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section - Fixed height */}
        <div className="relative h-40 bg-white overflow-hidden">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Sale badge */}
          {hasSale && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white font-bold text-xs">
                SALE
              </Badge>
            </div>
          )}

          {/* Add to cart indicator - subtle hover effect */}
          {isInStock && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-75 transition-opacity duration-300">
              <div className="bg-[#3da874]/80 text-white rounded-full p-1.5 shadow-md">
                <Plus className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Out of stock overlay */}
          {!isInStock && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs font-bold">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info Section - Fixed height with button */}
        <div
          className="h-32 p-3 bg-white border-t border-gray-100 flex flex-col justify-between cursor-pointer"
          onClick={handleClick}
        >
          {/* Product Name */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-center justify-between mt-1">
            {!hidePrices ? (
              <div className="flex items-center gap-2">
                {hasSale ? (
                  /* Sale pricing */
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-red-600">
                      ${salePrice!.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 line-through">
                      ${regularPrice.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  /* Regular pricing */
                  <div className="text-lg font-bold text-[#3da874]">
                    ${regularPrice.toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              /* Prices hidden */
              <div className="text-sm text-gray-500 font-medium">
                Contact staff for pricing
              </div>
            )}

            {/* Stock indicator for in-stock items */}
            {isInStock && (
              <div className="text-xs text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded">
                In Stock
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="mt-2">
            {isInStock ? (
              <Button
                onClick={handleAddToCart}
                className="w-full bg-[#3da874] hover:bg-[#2d7a56] text-white text-sm py-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            ) : (
              <Button
                disabled
                className="w-full text-sm py-1.5"
                size="sm"
                variant="secondary"
              >
                Out of Stock
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
