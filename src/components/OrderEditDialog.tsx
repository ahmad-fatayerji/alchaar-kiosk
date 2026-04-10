import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, X, Search } from "lucide-react";
import { useMessages } from "@/contexts/MessageContext";

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

type Product = {
  barcode: string;
  name: string;
  price: string;
  salePrice?: string | null;
  qtyInStock: number;
};

interface OrderEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: (updatedOrder: Order) => void;
}

export default function OrderEditDialog({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}: OrderEditDialogProps) {
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notify } = useMessages();

  useEffect(() => {
    if (order) {
      setEditedItems([...order.items]);
    }
  }, [order]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const products = await response.json();
        setSearchResults(products.slice(0, 10)); // Limit to 10 results
      }
    } catch (error) {
      console.error("Error searching products:", error);
    }
    setLoading(false);
  };

  const updateQuantity = (barcode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(barcode);
      return;
    }

    setEditedItems((prev) =>
      prev.map((item) =>
        item.barcode === barcode ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (barcode: string) => {
    setEditedItems((prev) => prev.filter((item) => item.barcode !== barcode));
  };

  const addProduct = (product: Product) => {
    const existingItem = editedItems.find(
      (item) => item.barcode === product.barcode
    );

    if (existingItem) {
      updateQuantity(product.barcode, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        barcode: product.barcode,
        name: product.name,
        quantity: 1,
        price: product.price,
        salePrice: product.salePrice,
      };
      setEditedItems((prev) => [...prev, newItem]);
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const getInOrderQuantity = (barcode: string) =>
    editedItems.find((item) => item.barcode === barcode)?.quantity ?? 0;

  const saveChanges = async () => {
    if (!order || editedItems.length === 0) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: editedItems.map((item) => ({
            barcode: item.barcode,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onOrderUpdated(result.order);
        onClose();
      } else {
        const error = await response.json();
        notify({ message: `Error: ${error.error}`, variant: "error" });
      }
    } catch (error) {
      console.error("Error saving order:", error);
      notify({ message: "Failed to save changes", variant: "error" });
    }
    setSaving(false);
  };

  const calculateTotal = () => {
    return editedItems.reduce((total, item) => {
      const price = parseFloat(item.salePrice || item.price);
      return total + price * item.quantity;
    }, 0);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl max-h-[86vh] overflow-hidden flex flex-col p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-3xl font-bold leading-none">
            <span>Edit Order #{order.orderNumber}</span>
            <Badge
              variant={order.isFulfilled ? "default" : "secondary"}
              className={`text-base px-3 py-1 leading-none ${
                order.isCancelled
                  ? "bg-red-600 text-white"
                  : order.isFulfilled
                    ? "bg-green-600 text-white"
                    : "bg-yellow-500 text-white"
              }`}
            >
              {order.isCancelled
                ? "Cancelled"
                : order.isFulfilled
                  ? "Fulfilled"
                  : "Pending"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-2">
          {/* Add Product Search */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products to add..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>

            {loading && searchTerm.length >= 2 && (
              <div className="text-base text-gray-500 px-1">Searching...</div>
            )}

            {!loading && searchTerm.length >= 2 && searchResults.length === 0 && (
              <div className="text-base text-gray-500 px-1">No matching products</div>
            )}

            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-44 overflow-y-auto">
                {searchResults.map((product) => {
                  const inOrderQty = getInOrderQuantity(product.barcode);
                  const remainingAfterOrder = product.qtyInStock - inOrderQty;

                  return (
                    <div
                      key={product.barcode}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                      onClick={() => addProduct(product)}
                    >
                      <div>
                        <div className="font-semibold text-xl leading-tight">{product.name}</div>
                        <div className="text-base text-gray-500">
                          {product.barcode}
                        </div>
                        <div
                          className={`text-sm ${
                            remainingAfterOrder <= 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          Stock: {product.qtyInStock}
                          {inOrderQty > 0 &&
                            ` | In order: ${inOrderQty} | Remaining: ${remainingAfterOrder}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-2xl">
                          {product.salePrice
                            ? `$${product.salePrice}`
                            : `$${product.price}`}
                        </div>
                        {product.salePrice && (
                          <div className="text-base text-gray-500 line-through">
                            ${product.price}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-2xl">Order Items</h3>
            {editedItems.length === 0 ? (
              <div className="text-center py-4 text-lg text-gray-500">
                No items in order. Search and add products above.
              </div>
            ) : (
              editedItems.map((item) => (
                <div
                  key={item.barcode}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4 border rounded"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-lg leading-tight break-words">
                      {item.name}
                    </div>
                    <div className="text-base text-gray-500">{item.barcode}</div>
                    <div className="text-lg leading-tight">
                      {item.salePrice ? (
                        <>
                          <span className="font-medium">${item.salePrice}</span>
                          <span className="text-gray-500 line-through ml-2">
                            ${item.price}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium">${item.price}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(item.barcode, item.quantity - 1)
                      }
                      className="h-12 w-12"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.barcode,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 h-12 text-xl text-center"
                      min="1"
                    />

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(item.barcode, item.quantity + 1)
                      }
                      className="h-12 w-12"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeItem(item.barcode)}
                      className="h-12 w-12 text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Total */}
          {editedItems.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-semibold text-3xl">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-12 px-6 text-xl">
            Cancel
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving || editedItems.length === 0}
            className="h-12 px-6 text-xl"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
