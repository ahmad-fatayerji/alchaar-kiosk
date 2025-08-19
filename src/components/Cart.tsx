"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/LangContext";

type CartProps = {
  onCheckout?: (orderNumber: string) => void;
};

type ProductStock = {
  barcode: string;
  qtyInStock: number;
};

export default function Cart({ onCheckout }: CartProps) {
  const {
    state,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    getTotalItems,
    getTotalPrice,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuantities, setShowQuantities] = useState(false);
  const [hidePrices, setHidePrices] = useState(false);
  const [productStocks, setProductStocks] = useState<Record<string, number>>(
    {}
  );
  const { t, formatDigits, formatPrice } = useI18n();

  // Load settings and fetch stock information when cart opens
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const settings = await response.json();
        const shouldShowQuantities = settings.show_quantities === "true";
        const shouldHidePrices = settings.hide_prices === "true";
        setShowQuantities(shouldShowQuantities);
        setHidePrices(shouldHidePrices);

        // If quantities are shown and cart is open with items, fetch stock info
        if (shouldShowQuantities && state.isOpen && state.items.length > 0) {
          const barcodes = state.items.map((item) => item.barcode).join(",");
          const stockResponse = await fetch(
            `/api/products?barcodes=${barcodes}`
          );

          if (stockResponse.ok) {
            const products: ProductStock[] = await stockResponse.json();
            const stockMap: Record<string, number> = {};
            products.forEach((product) => {
              stockMap[product.barcode] = product.qtyInStock;
            });
            setProductStocks(stockMap);
          }
        }
      } catch (error) {
        console.error("Error loading settings or stock data:", error);
        setShowQuantities(false);
        setHidePrices(false);
        setProductStocks({});
      }
    };

    loadSettings();
  }, [state.isOpen, state.items.length]);

  const handleQuantityUpdate = (barcode: string, newQuantity: number) => {
    const stockQty = productStocks[barcode];
    updateQuantity(barcode, newQuantity, stockQty, showQuantities);
  };

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            barcode: item.barcode,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onCheckout?.(result.orderNumber);
        clearCart();
      } else {
        const error = await response.json();
        if (error.error === "Insufficient stock for some items") {
          alert(
            `Cannot place order:\n\n${error.message}\n\nPlease adjust quantities and try again.`
          );
        } else if (error.error === "Some products do not exist") {
          alert(
            `Some products in your cart are no longer available. Please remove unavailable items and try again.`
          );
        } else {
          alert(`Failed to create order: ${error.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!state.isOpen) {
    return (
      <div className="fixed bottom-6 right-6 kiosk-fab z-50">
        <Button
          onClick={toggleCart}
          size="lg"
          className="bg-[#3da874] hover:bg-[#2d7a56] text-white rounded-full shadow-lg relative"
        >
          <ShoppingCart className="h-6 w-6" />
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.5rem] h-6 rounded-full flex items-center justify-center">
              {formatDigits(getTotalItems())}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-[#3da874]">
            {t("shopping_cart")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCart}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500">{t("cart_empty")}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {t("cart_add_products_hint")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                {state.items.map((item) => {
                  const price =
                    item.salePrice && Number(item.salePrice) > 0
                      ? Number(item.salePrice)
                      : Number(item.price);
                  const totalPrice = price * item.quantity;
                  const hasSale =
                    !hidePrices && item.salePrice && Number(item.salePrice) > 0;
                  const stockQty = productStocks[item.barcode];
                  const isAtStockLimit =
                    showQuantities &&
                    stockQty !== undefined &&
                    item.quantity >= stockQty;

                  return (
                    <div
                      key={item.barcode}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h4>
                        {/* Barcode intentionally hidden from customers */}
                        {showQuantities && stockQty !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            {t("available_in_stock", { count: stockQty })}
                            {isAtStockLimit && (
                              <span className="text-orange-600 font-medium">
                                {" "}
                                • {t("at_limit")}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hasSale ? (
                            <>
                              <span className="font-bold text-red-600">
                                ${price.toFixed(2)}
                              </span>
                              {!hidePrices && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${Number(item.price).toFixed(2)}
                                </span>
                              )}
                              {!hidePrices && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  SALE
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="font-bold text-[#3da874]">
                              ${price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityUpdate(
                              item.barcode,
                              item.quantity - 1
                            )
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {formatDigits(item.quantity)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityUpdate(
                              item.barcode,
                              item.quantity + 1
                            )
                          }
                          className="h-8 w-8 p-0"
                          disabled={isAtStockLimit}
                          title={
                            isAtStockLimit ? t("max_stock_reached") : undefined
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Item Total */}
                      <div className="text-lg font-bold text-[#3da874] w-20 text-right">
                        {formatPrice(totalPrice)}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.barcode)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">
                    {t("total_items")}: {formatDigits(getTotalItems())}
                  </div>
                  <div className="text-2xl font-bold text-[#3da874]">
                    {formatPrice(getTotalPrice())}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {t("clear_cart")}
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="flex-1 bg-[#3da874] hover:bg-[#2d7a56] text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      t("processing")
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {t("checkout")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
