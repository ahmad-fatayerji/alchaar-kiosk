"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Calendar, User, ArrowLeft } from "lucide-react";

type OrderItem = {
  barcode: string;
  name: string;
  quantity: number;
  price: string;
  salePrice?: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  createdAt: string;
  isFulfilled: boolean;
  items: OrderItem[];
};

export default function OrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `/api/orders?orderNumber=${orderNumber.trim()}`
      );

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else if (response.status === 404) {
        setError("Order not found");
      } else {
        setError("Failed to fetch order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setError("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFulfillOrder = async () => {
    if (!order) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/fulfill`, {
        method: "PATCH",
      });

      if (response.ok) {
        const result = await response.json();
        setOrder({ ...order, isFulfilled: true });

        // Show confirmation with quantity updates
        if (result.quantitiesUpdated && result.quantitiesUpdated.length > 0) {
          const updateSummary = result.quantitiesUpdated
            .map(
              (update: any) =>
                `${update.productName}: -${update.quantityDeducted} (${update.newStock} remaining)`
            )
            .join("\n");

          alert(
            `Order fulfilled successfully!\n\nStock updates:\n${updateSummary}`
          );
        } else {
          alert("Order fulfilled successfully!");
        }
      } else {
        const error = await response.json();
        if (error.error === "Insufficient stock") {
          setError(`Cannot fulfill order:\n${error.message}`);
          alert(
            `Cannot fulfill order:\n\n${error.message}\n\nPlease check inventory and try again.`
          );
        } else {
          setError(
            `Failed to mark order as fulfilled: ${
              error.error || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
      setError("Failed to mark order as fulfilled");
    }
  };

  const getTotalPrice = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => {
      const price =
        item.salePrice && Number(item.salePrice) > 0
          ? Number(item.salePrice)
          : Number(item.price);
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => (window.location.href = "/admin")}
            className="text-[#3da874] hover:bg-green-50"
          >
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Admin
          </Button>
          <h1 className="text-3xl font-bold text-[#3da874]">Order Lookup</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3da874]">
              <Search className="h-6 w-6" />
              Search Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter 4-digit order number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={4}
                className="text-center text-xl font-mono tracking-wider"
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-[#3da874] hover:bg-[#2d7a56] text-white px-8"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#3da874]">
                  <Package className="h-6 w-6" />
                  Order #{order.orderNumber}
                </CardTitle>
                <Badge
                  variant={order.isFulfilled ? "default" : "secondary"}
                  className={
                    order.isFulfilled ? "bg-green-500" : "bg-yellow-500"
                  }
                >
                  {order.isFulfilled ? "Fulfilled" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {getTotalItems()} items
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg">Order Items</h3>
                {order.items.map((item, index) => {
                  const price =
                    item.salePrice && Number(item.salePrice) > 0
                      ? Number(item.salePrice)
                      : Number(item.price);
                  const totalPrice = price * item.quantity;
                  const hasSale = item.salePrice && Number(item.salePrice) > 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h4>
                        <div className="text-sm text-gray-600">
                          Barcode: {item.barcode}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {hasSale ? (
                            <>
                              <span className="font-bold text-red-600">
                                ${price.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${Number(item.price).toFixed(2)}
                              </span>
                              <Badge className="bg-red-500 text-white text-xs">
                                SALE
                              </Badge>
                            </>
                          ) : (
                            <span className="font-bold text-[#3da874]">
                              ${price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center mx-6">
                        <div className="text-sm text-gray-600">Quantity</div>
                        <div className="text-xl font-bold">{item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-xl font-bold text-[#3da874]">
                          ${totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Order Total:</span>
                  <span className="text-[#3da874]">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!order.isFulfilled && (
                <div className="mt-6">
                  <Button
                    onClick={handleFulfillOrder}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-3"
                  >
                    Mark as Fulfilled
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
