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
  const hasAskForPriceItem = !hidePrices
    ? state.items.some((item) => {
        const hasSale =
          salesEnabled &&
          item.salePrice &&
          Number(item.salePrice) > 0;
        return !hasSale && Number(item.price) === 0;
      })
    : false;

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
      const margin = 96; // more breathing room large screens
      const rawY =
        ev.clientY - pointerOffsetRef.current + (rect ? rect.height / 2 : 0);
      // Prevent reaching extreme top / header area
      const header = document.querySelector(
        ".products-header-bar, .kiosk-header-static"
      ) as HTMLElement | null;
      const headerBottom = header?.getBoundingClientRect().bottom || 140;
      const topClamp = Math.max(margin, headerBottom + 40);
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
    // Anchored bottom-left; disable drag logic while preserving previous code for possible revert
    return (
      <div
        className="kiosk-fab fixed left-4 bottom-4 z-50"
        style={{
          insetInlineStart: undefined,
        }}
      >
        <Button
          ref={dragBtnRef}
          onClick={() => toggleCart()}
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
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 cart-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleCart();
      }}
      role="dialog"
      aria-modal="true"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="cart-panel w-[min(90vw,1150px)] max-h-[82vh] flex flex-col bg-white rounded-2xl shadow-xl px-8 py-6 md:px-10 md:py-8 overflow-hidden kiosk-portrait:w-[min(90vw,1700px)] kiosk-portrait:max-h-[78vh] kiosk-portrait:rounded-[2.5rem] kiosk-portrait:px-[4vw] kiosk-portrait:py-[3vh]"
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <CardTitle className="cart-title text-2xl md:text-3xl font-bold text-[#3da874] leading-tight kiosk-portrait:text-[clamp(3rem,4.2vw,5rem)]">
            {t("shopping_cart")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close cart"
            onClick={toggleCart}
            className="h-8 w-8 p-0 shrink-0 md:h-10 md:w-10 kiosk-portrait:h-[6rem] kiosk-portrait:w-[6rem] kiosk-portrait:hover:bg-red-50"
          >
            <X className="h-4 w-4 md:h-5 md:w-5 kiosk-portrait:h-[3rem] kiosk-portrait:w-[3rem]" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center px-2">
              <div className="space-y-4 md:space-y-6 kiosk-portrait:space-y-[3.5rem]">
                <ShoppingCart className="h-20 w-20 text-gray-300 mx-auto mb-4 md:h-24 md:w-24 kiosk-portrait:h-[14rem] kiosk-portrait:w-[14rem] kiosk-portrait:mb-[2.5rem]" />
                <p className="text-lg md:text-xl text-gray-500 font-medium kiosk-portrait:text-[clamp(2.2rem,2.4vw,3rem)] kiosk-portrait:font-semibold">
                  {t("cart_empty")}
                </p>
                <p className="text-sm md:text-base text-gray-400 mt-2 kiosk-portrait:text-[clamp(1.4rem,1.5vw,2rem)] kiosk-portrait:mt-[1.2rem]">
                  {t("cart_add_products_hint")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-4 md:space-y-5 mb-2 kiosk-portrait:space-y-[2.2rem] kiosk-portrait:pr-[1.5rem]">
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
                  const showAskForPrice =
                    !hidePrices && !hasSale && unitPrice === 0;
                  const stockQty = productStocks[item.barcode];
                  const isAtStockLimit =
                    showQuantities &&
                    stockQty !== undefined &&
                    item.quantity >= stockQty;

                  return (
                    <div
                      key={item.barcode}
                      className="flex items-center gap-4 md:gap-5 p-4 md:p-5 border border-gray-200 rounded-lg bg-gray-50 kiosk-portrait:gap-[2.8rem] kiosk-portrait:p-[2.2rem]"
                    >
                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm md:text-base kiosk-portrait:text-[clamp(1.8rem,1.4vw,2.4rem)]">
                          {item.name}
                        </h4>
                        {/* Barcode intentionally hidden from customers */}
                        {showQuantities && stockQty !== undefined && (
                          <div className="text-xs md:text-sm text-gray-500 mt-1 kiosk-portrait:text-[clamp(1.2rem,1.1vw,1.8rem)]">
                            {t("available_in_stock", { count: stockQty })}
                            {isAtStockLimit && (
                              <span className="text-orange-600 font-medium">
                                {" "}
                                • {t("at_limit")}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 kiosk-portrait:gap-[0.9rem]">
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
                          ) : showAskForPrice ? (
                            <span className="font-semibold text-gray-500">
                              {t("ask_for_price")}
                            </span>
                          ) : (
                            <span className="font-bold text-[#3da874]">
                              ${unitPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 md:gap-3 kiosk-portrait:gap-[1.4rem]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityUpdate(
                              item.barcode,
                              item.quantity - 1
                            )
                          }
                          className="cart-qty-btn h-8 w-8 p-0 md:h-9 md:w-9 kiosk-portrait:h-[4.4rem] kiosk-portrait:w-[4.4rem] kiosk-portrait:text-[2.2rem]"
                        >
                          <Minus className="h-4 w-4 kiosk-portrait:h-10 kiosk-portrait:w-10" />
                        </Button>
                        <span className="cart-qty-text w-8 text-center font-semibold md:w-10 kiosk-portrait:w-[4.4rem] kiosk-portrait:text-[2.2rem]">
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
                          className="cart-qty-btn h-8 w-8 p-0 md:h-9 md:w-9 kiosk-portrait:h-[4.4rem] kiosk-portrait:w-[4.4rem] kiosk-portrait:text-[2.2rem]"
                          disabled={isAtStockLimit}
                          title={
                            isAtStockLimit ? t("max_stock_reached") : undefined
                          }
                        >
                          <Plus className="h-4 w-4 kiosk-portrait:h-10 kiosk-portrait:w-10" />
                        </Button>
                      </div>

                      {/* Item Total */}
                      <div className="text-lg font-bold text-[#3da874] w-20 text-right md:w-24 kiosk-portrait:text-[clamp(2rem,1.6vw,2.8rem)] kiosk-portrait:w-[6.5rem]">
                        {showAskForPrice
                          ? t("ask_for_price")
                          : formatPrice(totalPrice)}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.barcode)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 md:h-9 md:w-9 kiosk-portrait:h-[4rem] kiosk-portrait:w-[4rem]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4 kiosk-portrait:mb-[2.4rem]">
                  <div className="text-lg font-semibold md:text-xl kiosk-portrait:text-[clamp(2rem,1.5vw,2.6rem)]">
                    {t("total_items")}: {formatDigits(getTotalItems())}
                  </div>
                  <div className="cart-total text-2xl font-bold text-[#3da874] md:text-[1.9rem] kiosk-portrait:text-[clamp(3rem,2.2vw,3.8rem)]">
                    {hasAskForPriceItem
                      ? t("ask_for_price")
                      : formatPrice(
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
                <div className="flex gap-3 md:gap-4 kiosk-portrait:gap-[2rem]">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="cart-action-btn flex-1 md:text-base kiosk-portrait:text-[clamp(2rem,1.5vw,2.4rem)] kiosk-portrait:py-[1.6rem]"
                    disabled={isProcessing}
                  >
                    {t("clear_cart")}
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="cart-action-btn flex-1 bg-[#3da874] hover:bg-[#2d7a56] text-white md:text-base kiosk-portrait:text-[clamp(2.2rem,1.6vw,2.6rem)] kiosk-portrait:py-[1.6rem]"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      t("processing")
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2 md:h-5 md:w-5 kiosk-portrait:h-[2.4rem] kiosk-portrait:w-[2.4rem] kiosk-portrait:mr-[1rem]" />
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
