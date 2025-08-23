"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
    setCartOpen,
    getTotalItems,
    getTotalPrice,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuantities, setShowQuantities] = useState(false);
  const [hidePrices, setHidePrices] = useState(false);
  const [salesEnabled, setSalesEnabled] = useState(true);
  const [productStocks, setProductStocks] = useState<Record<string, number>>(
    {}
  );
  const { t, formatDigits, formatPrice } = useI18n();

  // Floating cart (FAB) drag state (snap-to-edge)
  type FabDock = { side: "left" | "right"; y: number };
  const [fabDock, setFabDock] = useState<FabDock | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragBtnRef = useRef<HTMLButtonElement | null>(null);
  const pointerOffsetRef = useRef<number>(0); // offset inside button for smooth vertical drag

  // Load saved FAB dock (backwards compatibility with old free-float format)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawDock = localStorage.getItem("kiosk.cartFabDock");
      if (rawDock) {
        const parsed: any = JSON.parse(rawDock);
        if (
          (parsed.side === "left" || parsed.side === "right") &&
          typeof parsed.y === "number"
        ) {
          setFabDock(parsed as FabDock);
          return;
        }
      }
      // Fallback: migrate old position format (x,y)
      const legacy = localStorage.getItem("kiosk.cartFabPos");
      if (legacy) {
        const p: any = JSON.parse(legacy);
        if (typeof p.x === "number" && typeof p.y === "number") {
          const side: FabDock["side"] =
            p.x < window.innerWidth / 2 ? "left" : "right";
          const y = Math.min(Math.max(p.y, 80), window.innerHeight - 80);
          const migrated: FabDock = { side, y };
          setFabDock(migrated);
          localStorage.setItem("kiosk.cartFabDock", JSON.stringify(migrated));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Pointer handlers for edge docking
  const handleFabPointerDown: React.PointerEventHandler = (e) => {
    if (state.isOpen) return;
    setIsDragging(true);
    const rect = dragBtnRef.current?.getBoundingClientRect();
    pointerOffsetRef.current = rect ? e.clientY - rect.top : 0;

    const move = (ev: PointerEvent) => {
      const side: FabDock["side"] =
        ev.clientX < window.innerWidth / 2 ? "left" : "right";
      const margin = 64;
      const rawY =
        ev.clientY - pointerOffsetRef.current + (rect ? rect.height / 2 : 0);
      let topClamp = margin;
      const boundaryEl = document.querySelector(
        ".products-toolbar"
      ) as HTMLElement | null;
      if (boundaryEl) {
        const bRect = boundaryEl.getBoundingClientRect();
        // Only clamp if toolbar is within viewport top half (main UI)
        topClamp = Math.max(topClamp, bRect.bottom + 32);
      }
      const maxY = window.innerHeight - margin;
      const y = Math.min(Math.max(rawY, topClamp), maxY);
      setFabDock({ side, y });
    };
    const up = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (fabDock) {
        try {
          localStorage.setItem("kiosk.cartFabDock", JSON.stringify(fabDock));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  // Persist whenever dock changes
  useEffect(() => {
    if (fabDock) {
      try {
        localStorage.setItem("kiosk.cartFabDock", JSON.stringify(fabDock));
      } catch {
        /* ignore */
      }
    }
  }, [fabDock]);

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
        // Disable sales when price are hidden or when sales_enabled explicitly false
        setSalesEnabled(
          !shouldHidePrices && settings.sales_enabled !== "false"
        );

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
        setSalesEnabled(true);
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
        // Clear and explicitly close cart so next session starts closed
        clearCart();
        setCartOpen(false);
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
    const dock = fabDock || {
      side: "right" as const,
      y: window.innerHeight / 2,
    };
    const style: React.CSSProperties = {
      position: "fixed",
      top: dock.y,
      [dock.side]: 24,
      transform: "translateY(-50%)",
      zIndex: 50,
      cursor: isDragging ? "grabbing" : "grab",
      bottom: "auto",
    } as any;
    return (
      <div style={style} className="kiosk-fab">
        <Button
          ref={dragBtnRef}
          onPointerDown={handleFabPointerDown}
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return;
            }
            toggleCart();
          }}
          aria-label={t("shopping_cart")}
          className="bg-[#3da874] hover:bg-[#2d7a56] text-white rounded-full relative h-14 w-14 p-0 flex items-center justify-center shadow-xl transition-all kiosk-portrait:h-[6rem] kiosk-portrait:w-[6rem] kiosk-portrait:border-4 kiosk-portrait:border-white/30 kiosk-portrait:shadow-2xl kiosk-portrait:shadow-black/30"
        >
          <ShoppingCart className="h-7 w-7 kiosk-portrait:h-[3rem] kiosk-portrait:w-[3rem]" />
          {getTotalItems() > 0 && (
            <Badge className="cart-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.5rem] h-6 rounded-full flex items-center justify-center kiosk-portrait:-top-2.5 kiosk-portrait:-right-2.5 kiosk-portrait:text-lg kiosk-portrait:min-w-[2.4rem] kiosk-portrait:h-[2.4rem] kiosk-portrait:rounded-full kiosk-portrait:px-1.5 kiosk-portrait:font-bold kiosk-portrait:tracking-tight">
              {formatDigits(getTotalItems())}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 cart-modal">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white kiosk-portrait:w-[94vw] kiosk-portrait:h-[88vh] kiosk-portrait:max-w-none kiosk-portrait:max-h-none kiosk-portrait:text-[1.4rem] kiosk-portrait:rounded-[2.25rem] kiosk-portrait:px-14 kiosk-portrait:py-10 kiosk-portrait:shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="cart-title text-2xl font-bold text-[#3da874] kiosk-portrait:text-[4.5rem] kiosk-portrait:leading-tight">
            {t("shopping_cart")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCart}
            className="h-8 w-8 p-0 kiosk-portrait:h-20 kiosk-portrait:w-20"
          >
            <X className="h-4 w-4 kiosk-portrait:h-12 kiosk-portrait:w-12" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="kiosk-portrait:space-y-6">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4 kiosk-portrait:h-64 kiosk-portrait:w-64 kiosk-portrait:mb-10" />
                <p className="text-lg text-gray-500 kiosk-portrait:text-[3rem] kiosk-portrait:font-semibold">
                  {t("cart_empty")}
                </p>
                <p className="text-sm text-gray-400 mt-2 kiosk-portrait:text-[1.75rem] kiosk-portrait:mt-4">
                  {t("cart_add_products_hint")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 kiosk-portrait:space-y-8 kiosk-portrait:pr-4">
                {state.items.map((item) => {
                  const hasSale =
                    salesEnabled &&
                    !hidePrices &&
                    item.salePrice &&
                    Number(item.salePrice) > 0;
                  const unitPrice = hasSale
                    ? Number(item.salePrice)
                    : Number(item.price);
                  const totalPrice = unitPrice * item.quantity;
                  const stockQty = productStocks[item.barcode];
                  const isAtStockLimit =
                    showQuantities &&
                    stockQty !== undefined &&
                    item.quantity >= stockQty;

                  return (
                    <div
                      key={item.barcode}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 kiosk-portrait:gap-10 kiosk-portrait:p-8"
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
                                ${unitPrice.toFixed(2)}
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
                              ${unitPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 kiosk-portrait:gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityUpdate(
                              item.barcode,
                              item.quantity - 1
                            )
                          }
                          className="cart-qty-btn h-8 w-8 p-0 kiosk-portrait:h-20 kiosk-portrait:w-20 kiosk-portrait:text-[2rem]"
                        >
                          <Minus className="h-4 w-4 kiosk-portrait:h-10 kiosk-portrait:w-10" />
                        </Button>
                        <span className="cart-qty-text w-8 text-center font-semibold">
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
                          className="cart-qty-btn h-8 w-8 p-0 kiosk-portrait:h-20 kiosk-portrait:w-20 kiosk-portrait:text-[2rem]"
                          disabled={isAtStockLimit}
                          title={
                            isAtStockLimit ? t("max_stock_reached") : undefined
                          }
                        >
                          <Plus className="h-4 w-4 kiosk-portrait:h-10 kiosk-portrait:w-10" />
                        </Button>
                      </div>

                      {/* Item Total */}
                      <div className="text-lg font-bold text-[#3da874] w-20 text-right kiosk-portrait:text-[2rem] kiosk-portrait:w-32">
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
                <div className="flex items-center justify-between mb-4 kiosk-portrait:mb-8">
                  <div className="text-lg font-semibold kiosk-portrait:text-[2rem]">
                    {t("total_items")}: {formatDigits(getTotalItems())}
                  </div>
                  <div className="cart-total text-2xl font-bold text-[#3da874] kiosk-portrait:text-[3rem]">
                    {formatPrice(
                      state.items.reduce((sum, i) => {
                        const applySale =
                          salesEnabled &&
                          !hidePrices &&
                          i.salePrice &&
                          Number(i.salePrice) > 0;
                        const p = applySale
                          ? Number(i.salePrice)
                          : Number(i.price);
                        return sum + p * i.quantity;
                      }, 0)
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 kiosk-portrait:gap-6">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="cart-action-btn flex-1 kiosk-portrait:text-[1.5rem] kiosk-portrait:py-6"
                    disabled={isProcessing}
                  >
                    {t("clear_cart")}
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="cart-action-btn flex-1 bg-[#3da874] hover:bg-[#2d7a56] text-white kiosk-portrait:text-[1.8rem] kiosk-portrait:py-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      t("processing")
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2 kiosk-portrait:h-8 kiosk-portrait:w-8" />
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
