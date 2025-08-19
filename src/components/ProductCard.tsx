"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useThumbVersion } from "@/hooks/useThumbVersion";
import { useI18n } from "@/contexts/LangContext";

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
  const v = useThumbVersion();
  const { t, formatPrice } = useI18n();
  const base = `/files/products/${product.barcode}`;
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
  const hasSale =
    !hidePrices &&
    salesEnabled &&
    product.salePrice &&
    Number(product.salePrice) > 0;
  const regularPrice = Number(product.price);
  const salePrice = hasSale ? Number(product.salePrice) : null;
  const showNA = !hasSale && !hidePrices && salesEnabled && regularPrice === 0;

  function fallback(img: HTMLImageElement) {
    const tried = img.src.split("?")[0];
    const ext = tried.slice(tried.lastIndexOf("."));
    const next = exts[exts.indexOf(ext) + 1];
    if (next) {
      img.src = `${base}${next}?v=${v}`;
    } else {
      setImageError(true);
    }
  }

  // Load settings
  useEffect(() => {
    if (hidePricesOverride !== undefined) {
      setHidePrices(hidePricesOverride);
    } else {
      // Fetch settings if no override is provided
      fetch("/api/settings")
        .then((res) => res.json())
        .then((settings) => {
          const hp = settings.hide_prices === "true";
          setHidePrices(hp);
          // If prices are hidden, also disable sales indicators
          setSalesEnabled(!hp && settings.sales_enabled !== "false");
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
      className="group cursor-pointer w-full aspect-[3/4] overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition duration-200"
      onClick={handleClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative flex-1 bg-gray-50 overflow-hidden">
          {!imageError ? (
            <img
              src={`${base}${exts[0]}?v=${v}`}
              alt={product.name}
              onError={(e) => fallback(e.currentTarget)}
              className="absolute inset-0 h-full w-full object-cover select-none"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Sale badge */}
          {hasSale && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white font-semibold text-[10px] rounded-full px-2 py-0.5 shadow-sm">
                SALE
              </Badge>
            </div>
          )}

          {/* Stock status badge */}
          <div className="absolute top-2 right-2">
            {!isInStock ? (
              <Badge variant="destructive" className="text-xs font-bold">
                {t("out_of_stock")}
              </Badge>
            ) : (
              showQuantities && (
                <Badge
                  variant="secondary"
                  className={`text-[11px] leading-none font-semibold rounded-full h-6 px-2 inline-flex items-center justify-center ${
                    product.qtyInStock <= 5
                      ? "bg-orange-100 text-orange-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {t("stock_left_short", { count: product.qtyInStock })}
                </Badge>
              )
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* Price Section */}
          {!hidePrices && (
            <div className="mt-1">
              {hasSale ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">
                    {formatPrice(salePrice!)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(regularPrice)}
                  </span>
                </div>
              ) : showNA ? (
                <span className="text-lg font-semibold text-gray-500">N/A</span>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(regularPrice)}
                </span>
              )}
            </div>
          )}

          {hidePrices && (
            <p className="text-sm text-gray-500 mb-3">
              {t("contact_for_pricing")}
            </p>
          )}

          {/* Add to Cart Button */}
          <div className="mt-3">
            {isInStock ? (
              <Button
                onClick={handleAddToCart}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t("add_to_cart")}
              </Button>
            ) : (
              <Button disabled className="w-full" size="sm" variant="secondary">
                {t("out_of_stock_btn")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
