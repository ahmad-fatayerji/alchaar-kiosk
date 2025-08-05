"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Package, ShoppingCart } from "lucide-react";
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
  const [showQuantities, setShowQuantities] = useState(false);
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
      // Fetch settings if no override is provided
      fetch("/api/settings")
        .then((res) => res.json())
        .then((settings) => {
          setHidePrices(settings.hide_prices === "true");
          setSalesEnabled(settings.sales_enabled !== "false");
          setShowQuantities(settings.show_quantities === "true");
        })
        .catch(() => {
          setHidePrices(false);
          setSalesEnabled(true);
          setShowQuantities(false);
        });
    }
  }, [hidePricesOverride]);

  const handleClick = () => {
    onClick?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isInStock) {
      return;
    }

    addItem(
      {
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
      },
      product.qtyInStock,
      showQuantities
    );
  };

  return (
    <Card
      className="group cursor-pointer w-full aspect-[3/4] max-w-[280px] mx-auto overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 rounded-xl"
      onClick={handleClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative flex-1 bg-gray-100 overflow-hidden">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
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

          {/* Stock status badge */}
          <div className="absolute top-2 right-2">
            {!isInStock ? (
              <Badge variant="destructive" className="text-xs font-bold">
                Out of Stock
              </Badge>
            ) : (
              showQuantities && (
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${
                    product.qtyInStock <= 5
                      ? "bg-orange-100 text-orange-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {product.qtyInStock} left
                </Badge>
              )
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#3da874] transition-colors duration-200 line-clamp-2">
            {product.name}
          </h3>

          {/* Price Section */}
          {!hidePrices && (
            <div className="mb-3">
              {hasSale ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">
                    ${salePrice!.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ${regularPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-[#3da874]">
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}

          {hidePrices && (
            <p className="text-sm text-gray-500 mb-3">
              Contact staff for pricing
            </p>
          )}

          {/* Add to Cart Button */}
          <div className="mt-3">
            {isInStock ? (
              <Button
                onClick={handleAddToCart}
                className="w-full bg-[#3da874] hover:bg-[#2d7a56] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            ) : (
              <Button disabled className="w-full" size="sm" variant="secondary">
                Out of Stock
              </Button>
            )}
          </div>

          {/* Action indicator */}
          <div className="mt-2 text-xs text-[#3da874] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isInStock ? "Click to add →" : "Contact staff"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
