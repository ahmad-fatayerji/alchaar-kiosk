"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  Edit,
  Search,
} from "lucide-react";
import OrderEditDialog from "@/components/OrderEditDialog";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { formatLebanon, todayInLebanonYMD, ymdInLebanon } from "@/lib/time";
import { useMessages } from "@/contexts/MessageContext";

const FORGOTTEN_THRESHOLD_MS = 10 * 60 * 1000;
const AGE_REFRESH_MS = 60 * 1000;

type OrdersTab = "all" | "pending";

type OrderItem = {
  barcode: string;
  name: string;
  quantity: number;
  price: string;
  salePrice?: string | null;
};

type Order = {
  id: number;
  orderNumber: string | null;
  createdAt: string;
  isFulfilled: boolean;
  isCancelled: boolean;
  items: OrderItem[];
};

const isPendingOrder = (order: Order) => !order.isFulfilled && !order.isCancelled;

const sortOrdersNewestFirst = (orders: Order[]) =>
  [...orders].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const sortOrdersOldestFirst = (orders: Order[]) =>
  [...orders].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );

const upsertOrder = (
  orders: Order[],
  nextOrder: Order,
  sortOrders: (orders: Order[]) => Order[]
) => {
  const nextOrders = orders.filter((order) => order.id !== nextOrder.id);
  nextOrders.push(nextOrder);
  return sortOrders(nextOrders);
};

const removeOrderById = (orders: Order[], orderId: number) =>
  orders.filter((order) => order.id !== orderId);

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrdersTab>("all");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [allLoading, setAllLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(() =>
    todayInLebanonYMD()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  const { isConnected, handleOrderUpdate } = useOrderUpdates(dateFilter);
  const { notify, confirm } = useMessages();

  useEffect(() => {
    fetchOrdersByDate();
  }, [dateFilter]);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, AGE_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = handleOrderUpdate((update) => {
      if (update.type === "new_order" && update.order) {
        const incomingOrder = update.order as Order;
        markNewOrder(incomingOrder.id);

        if (ymdInLebanon(incomingOrder.createdAt) === dateFilter) {
          setAllOrders((prevOrders) =>
            upsertOrder(prevOrders, incomingOrder, sortOrdersNewestFirst)
          );
        }

        if (isPendingOrder(incomingOrder)) {
          setPendingOrders((prevOrders) =>
            upsertOrder(prevOrders, incomingOrder, sortOrdersOldestFirst)
          );
        }
      } else if (update.type === "order_updated" && update.order) {
        const updatedOrder = update.order as Order;

        setAllOrders((prevOrders) => {
          if (ymdInLebanon(updatedOrder.createdAt) !== dateFilter) {
            return removeOrderById(prevOrders, updatedOrder.id);
          }

          return upsertOrder(prevOrders, updatedOrder, sortOrdersNewestFirst);
        });

        setPendingOrders((prevOrders) =>
          isPendingOrder(updatedOrder)
            ? upsertOrder(prevOrders, updatedOrder, sortOrdersOldestFirst)
            : removeOrderById(prevOrders, updatedOrder.id)
        );
      } else if (update.type === "order_fulfilled" && update.orderId) {
        setAllOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === update.orderId ? { ...order, isFulfilled: true } : order
          )
        );
        setPendingOrders((prevOrders) =>
          removeOrderById(prevOrders, update.orderId as number)
        );
      } else if (update.type === "order_cancelled" && update.order?.id) {
        setAllOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === update.order.id ? { ...order, isCancelled: true } : order
          )
        );
        setPendingOrders((prevOrders) =>
          removeOrderById(prevOrders, update.order.id as number)
        );
      }
    });

    return cleanup;
  }, [dateFilter, handleOrderUpdate]);

  const markNewOrder = (orderId: number) => {
    setNewOrderIds((prev) => new Set(prev).add(orderId));

    window.setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, 5000);
  };

  const fetchOrdersByDate = async () => {
    if (!dateFilter) {
      setAllOrders([]);
      setAllLoading(false);
      return;
    }

    setAllLoading(true);
    try {
      const response = await fetch(`/api/orders/by-date?date=${dateFilter}`);
      if (response.ok) {
        const dateOrders = (await response.json()) as Order[];
        setAllOrders(sortOrdersNewestFirst(dateOrders));
      } else {
        setAllOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setAllOrders([]);
    } finally {
      setAllLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch("/api/orders/pending");
      if (response.ok) {
        const openOrders = (await response.json()) as Order[];
        setPendingOrders(sortOrdersOldestFirst(openOrders));
      } else {
        setPendingOrders([]);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      setPendingOrders([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleFulfillOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/fulfill`, {
        method: "PATCH",
      });

      if (response.ok) {
        const result = await response.json();
        setAllOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, isFulfilled: true } : order
          )
        );
        setPendingOrders((prevOrders) => removeOrderById(prevOrders, orderId));

        if (result.quantitiesUpdated && result.quantitiesUpdated.length > 0) {
          const updateSummary = result.quantitiesUpdated
            .map(
              (update: {
                productName: string;
                quantityDeducted: number;
                newStock: number;
              }) =>
                `${update.productName}: -${update.quantityDeducted} (${update.newStock} remaining)`
            )
            .join("\n");

          notify({
            title: "Order fulfilled",
            message: `Stock updates:\n${updateSummary}`,
            variant: "success",
            duration: 9000,
          });
        } else {
          notify({
            message: "Order fulfilled successfully!",
            variant: "success",
          });
        }
      } else {
        const error = await response.json();
        if (error.error === "Insufficient stock") {
          notify({
            title: "Cannot fulfill order",
            message: `${error.message}\n\nPlease check inventory and try again.`,
            variant: "error",
            duration: 9000,
          });
        } else {
          notify({
            message: `Error fulfilling order: ${error.error || "Unknown error"}`,
            variant: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
      notify({
        message: "Failed to fulfill order. Please try again.",
        variant: "error",
      });
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    const confirmed = await confirm({
      message: "Are you sure you want to cancel this order?",
      confirmLabel: "Cancel order",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });

      if (response.ok) {
        const result = await response.json();
        setAllOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, isCancelled: true, ...result.order }
              : order
          )
        );
        setPendingOrders((prevOrders) => removeOrderById(prevOrders, orderId));
        notify({ message: "Order cancelled successfully!", variant: "success" });
      } else {
        const error = await response.json();
        notify({
          message: `Error cancelling order: ${error.error || "Unknown error"}`,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      notify({
        message: "Failed to cancel order. Please try again.",
        variant: "error",
      });
    }
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setAllOrders((prevOrders) => {
      if (ymdInLebanon(updatedOrder.createdAt) !== dateFilter) {
        return removeOrderById(prevOrders, updatedOrder.id);
      }

      return upsertOrder(prevOrders, updatedOrder, sortOrdersNewestFirst);
    });

    setPendingOrders((prevOrders) =>
      isPendingOrder(updatedOrder)
        ? upsertOrder(prevOrders, updatedOrder, sortOrdersOldestFirst)
        : removeOrderById(prevOrders, updatedOrder.id)
    );
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders((prevExpanded) => {
      const nextExpanded = new Set(prevExpanded);
      if (nextExpanded.has(orderId)) {
        nextExpanded.delete(orderId);
      } else {
        nextExpanded.add(orderId);
      }
      return nextExpanded;
    });
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

  const getTotalPrice = (order: Order) =>
    order.items.reduce((total, item) => {
      const price =
        item.salePrice && Number(item.salePrice) > 0
          ? Number(item.salePrice)
          : Number(item.price);
      return total + price * item.quantity;
    }, 0);

  const getTotalItems = (order: Order) =>
    order.items.reduce((total, item) => total + item.quantity, 0);

  const getOrderAgeMs = (order: Order) =>
    Math.max(0, now - new Date(order.createdAt).getTime());

  const formatOrderAge = (order: Order) => {
    const totalMinutes = Math.floor(getOrderAgeMs(order) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) return `${totalMinutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const isForgottenPendingOrder = (order: Order) =>
    isPendingOrder(order) && getOrderAgeMs(order) >= FORGOTTEN_THRESHOLD_MS;

  const filteredAllOrders = allOrders.filter((order) => {
    if (!searchTerm) return true;
    const { suffix } = formatOrderNumber(order.orderNumber);
    return suffix.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const forgottenPendingCount = pendingOrders.filter((order) =>
    isForgottenPendingOrder(order)
  ).length;

  const renderStatusBadge = (order: Order) => (
    <Badge
      variant="secondary"
      className={
        order.isCancelled
          ? "bg-red-600 text-white hover:bg-red-700"
          : order.isFulfilled
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-yellow-500 text-white hover:bg-yellow-600"
      }
    >
      {order.isCancelled
        ? "Cancelled"
        : order.isFulfilled
          ? "Fulfilled"
          : "Pending"}
    </Badge>
  );

  const renderOrderItems = (order: Order) => (
    <div className="grid gap-3">
      {order.items.map((item, index) => {
        const price =
          item.salePrice && Number(item.salePrice) > 0
            ? Number(item.salePrice)
            : Number(item.price);
        const hasSale = item.salePrice && Number(item.salePrice) > 0;

        return (
          <div
            key={`${order.id}-${item.barcode}-${index}`}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">{item.barcode}</div>
            </div>

            <div className="flex items-center gap-6 text-sm ml-4">
              <div className="text-center min-w-[60px]">
                <div className="text-xs text-gray-500">Qty</div>
                <div className="font-medium">x{item.quantity}</div>
              </div>
              <div className="text-center min-w-[80px]">
                <div className="text-xs text-gray-500">Unit Price</div>
                {hasSale ? (
                  <div className="flex flex-col items-center">
                    <span className="text-red-600 font-medium">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 line-through text-xs">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="font-medium">${price.toFixed(2)}</span>
                )}
              </div>
              <div className="text-center min-w-[80px]">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-[#3da874] font-semibold">
                  ${(price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderOrderActions = (order: Order) => {
    if (!isPendingOrder(order)) return null;

    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={(event) => {
            event.stopPropagation();
            handleEditOrder(order);
          }}
          size="sm"
          variant="outline"
          className="flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Edit className="h-3 w-3" />
          Edit
        </Button>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            handleFulfillOrder(order.id);
          }}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white font-medium"
        >
          Mark Fulfilled
        </Button>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            handleCancelOrder(order.id);
          }}
          size="sm"
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          Cancel Order
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#3da874]">
            Orders Management
          </h1>

          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? "Live Updates" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <Button
                type="button"
                variant={activeTab === "all" ? "default" : "ghost"}
                className="h-10 rounded-lg"
                onClick={() => setActiveTab("all")}
              >
                All Orders
              </Button>
              <Button
                type="button"
                variant={activeTab === "pending" ? "default" : "ghost"}
                className="h-10 rounded-lg"
                onClick={() => setActiveTab("pending")}
              >
                <span>Pending Orders</span>
                {forgottenPendingCount > 0 && (
                  <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {forgottenPendingCount}
                  </span>
                )}
              </Button>
            </div>

            {activeTab === "pending" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock3 className="h-4 w-4" />
                <span>
                  {pendingOrders.length} open order
                  {pendingOrders.length === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>

          {activeTab === "all" && (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="w-auto"
                />
              </div>

              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search order number..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-48"
                />
              </div>

              <Button
                onClick={() => {
                  setDateFilter(todayInLebanonYMD());
                  setSearchTerm("");
                }}
                variant="outline"
                size="sm"
              >
                Today
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "all" ? (
        allLoading ? (
          <div className="text-center py-8 text-gray-500">Loading orders...</div>
        ) : filteredAllOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {dateFilter
              ? `No orders found for ${formatLebanon(`${dateFilter}T00:00:00`, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}`
              : "Select a date to view orders."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAllOrders.map((order) => {
              const { prefix, suffix } = formatOrderNumber(order.orderNumber);
              const isExpanded = expandedOrders.has(order.id);
              const isNewOrder = newOrderIds.has(order.id);

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "overflow-hidden transition-all duration-500",
                    isNewOrder && "ring-2 ring-green-500 bg-green-50 animate-pulse"
                  )}
                >
                  <CardContent className="p-0">
                    <div
                      className={cn(
                        "p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between",
                        isNewOrder && "bg-green-50"
                      )}
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

                        {renderStatusBadge(order)}
                      </div>

                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-gray-600 min-w-[80px]">
                          <span className="font-medium">
                            {getTotalItems(order)}{" "}
                            {getTotalItems(order) === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <div className="font-semibold text-[#3da874] text-base min-w-[80px] text-right">
                          ${getTotalPrice(order).toFixed(2)}
                        </div>
                        <div className="text-gray-500 min-w-[80px] text-right">
                          {formatLebanon(order.createdAt, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-white p-4">
                        {renderOrderItems(order)}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            Ordered:{" "}
                            {formatLebanon(order.createdAt, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-xl font-bold text-[#3da874]">
                              Total: ${getTotalPrice(order).toFixed(2)}
                            </div>

                            {renderOrderActions(order)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : pendingLoading ? (
        <div className="text-center py-8 text-gray-500">
          Loading pending orders...
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pending orders right now.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOrders.map((order) => {
            const { prefix, suffix } = formatOrderNumber(order.orderNumber);
            const isNewOrder = newOrderIds.has(order.id);
            const isForgotten = isForgottenPendingOrder(order);

            return (
              <Card
                key={order.id}
                className={cn(
                  "overflow-hidden border-l-4 transition-all duration-500",
                  isForgotten
                    ? "border-l-amber-500 bg-amber-50/50"
                    : "border-l-[#3da874]",
                  isNewOrder && "ring-2 ring-green-500"
                )}
              >
                <CardContent className="p-0">
                  <div className="bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm text-gray-500">
                            #{prefix}
                          </span>
                          <span className="font-mono text-xl font-bold text-[#3da874]">
                            {suffix}
                          </span>
                          {renderStatusBadge(order)}
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-gray-200 text-gray-700",
                              isForgotten && "border-amber-300 text-amber-700"
                            )}
                          >
                            <Clock3 className="h-3 w-3" />
                            {formatOrderAge(order)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                          <span>
                            Created{" "}
                            {formatLebanon(order.createdAt, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>
                            {getTotalItems(order)}{" "}
                            {getTotalItems(order) === 1 ? "item" : "items"}
                          </span>
                          <span className="font-semibold text-[#3da874]">
                            Total ${getTotalPrice(order).toFixed(2)}
                          </span>
                        </div>

                        {isForgotten && (
                          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                            <AlertTriangle className="h-4 w-4" />
                            Pending for {formatOrderAge(order)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {renderOrderActions(order)}
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">{renderOrderItems(order)}</div>
                  </div>
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
