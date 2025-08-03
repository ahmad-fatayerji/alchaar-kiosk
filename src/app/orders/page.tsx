"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Search,
  Edit,
} from "lucide-react";
import OrderEditDialog from "@/components/OrderEditDialog";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());

  const { isConnected, handleOrderUpdate } = useOrderUpdates(dateFilter);

  useEffect(() => {
    fetchOrdersByDate();
  }, [dateFilter]);

  // Set up real-time order updates
  useEffect(() => {
    const cleanup = handleOrderUpdate((update) => {
      if (update.type === "new_order") {
        // Only add the order if it's for the currently filtered date
        if (update.date === dateFilter) {
          setOrders((prevOrders) => {
            // Check if order already exists to avoid duplicates
            const exists = prevOrders.some(
              (order) => order.id === update.order.id
            );
            if (!exists) {
              // Mark this as a new order for visual highlighting
              setNewOrderIds((prev) => new Set(prev).add(update.order.id));

              // Remove the highlight after 5 seconds
              setTimeout(() => {
                setNewOrderIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(update.order.id);
                  return newSet;
                });
              }, 5000);

              return [update.order, ...prevOrders]; // Add new order at the beginning
            }
            return prevOrders;
          });
        }
      } else if (update.type === "order_updated") {
        // Update existing order
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === update.order.id ? update.order : order
          )
        );
      } else if (update.type === "order_fulfilled") {
        // Update order fulfillment status
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === update.orderId
              ? { ...order, isFulfilled: true }
              : order
          )
        );
      }
    });

    return cleanup;
  }, [dateFilter, handleOrderUpdate]);

  const fetchOrdersByDate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/by-date?date=${dateFilter}`);
      if (response.ok) {
        const dateOrders = await response.json();
        setOrders(dateOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/fulfill`, {
        method: "PATCH",
      });
      if (response.ok) {
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, isFulfilled: true } : order
          )
        );
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatOrderNumber = (orderNumber: string | null | undefined) => {
    if (!orderNumber || orderNumber.length < 3) {
      return { prefix: "", suffix: orderNumber || "N/A" };
    }
    return {
      prefix: orderNumber.slice(0, -3),
      suffix: orderNumber.slice(-3),
    };
  };

  const getTotalPrice = (order: Order) => {
    return order.items.reduce((total, item) => {
      const price =
        item.salePrice && Number(item.salePrice) > 0
          ? Number(item.salePrice)
          : Number(item.price);
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItems = (order: Order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const { suffix } = formatOrderNumber(order.orderNumber);
    return suffix.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#3da874]">
            Orders Management
          </h1>

          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {isConnected ? "Live Updates" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Simple Filters */}
        <div className="flex gap-4 items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>

          <Button
            onClick={() => {
              const today = new Date();
              setDateFilter(today.toISOString().slice(0, 10));
              setSearchTerm("");
            }}
            variant="outline"
            size="sm"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders found for {new Date(dateFilter).toLocaleDateString()}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const { prefix, suffix } = formatOrderNumber(order.orderNumber);
            const isExpanded = expandedOrders.has(order.id);
            const isNewOrder = newOrderIds.has(order.id);

            return (
              <Card
                key={order.id}
                className={`overflow-hidden transition-all duration-500 ${
                  isNewOrder
                    ? "ring-2 ring-green-500 bg-green-50 animate-pulse"
                    : ""
                }`}
              >
                <CardContent className="p-0">
                  {/* Order Header - Always Visible */}
                  <div
                    className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      isNewOrder ? "bg-green-50" : ""
                    }`}
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">
                          #{prefix}
                        </span>
                        <span className="font-mono text-lg font-bold text-[#3da874]">
                          {suffix}
                        </span>
                      </div>

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
                      <span>{getTotalItems(order)} items</span>
                      <span className="font-semibold">
                        ${getTotalPrice(order).toFixed(2)}
                      </span>
                      <span>
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Order Details - Collapsible */}
                  {isExpanded && (
                    <div className="border-t bg-white p-4">
                      <div className="grid gap-3">
                        {order.items.map((item, index) => {
                          const price =
                            item.salePrice && Number(item.salePrice) > 0
                              ? Number(item.salePrice)
                              : Number(item.price);
                          const hasSale =
                            item.salePrice && Number(item.salePrice) > 0;

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                  {item.barcode}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600">
                                  ×{item.quantity}
                                </span>
                                <div className="text-right">
                                  {hasSale ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-600 font-medium">
                                        ${price.toFixed(2)}
                                      </span>
                                      <span className="text-gray-400 line-through text-xs">
                                        ${Number(item.price).toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-medium">
                                      ${price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[#3da874] font-semibold w-16 text-right">
                                  ${(price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Ordered: {new Date(order.createdAt).toLocaleString()}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-[#3da874]">
                            Total: ${getTotalPrice(order).toFixed(2)}
                          </div>

                          <div className="flex items-center gap-2">
                            {!order.isFulfilled && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditOrder(order);
                                }}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            )}

                            {!order.isFulfilled && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFulfillOrder(order.id);
                                }}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                              >
                                Mark Fulfilled
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OrderEditDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
