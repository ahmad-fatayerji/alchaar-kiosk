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

type Product = {
  barcode: string;
  name: string;
  price: string;
  salePrice?: string | null;
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
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save changes");
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Edit Order #{order.orderNumber}
            <Badge
              variant={order.isFulfilled ? "default" : "secondary"}
              className="ml-2"
            >
              {order.isFulfilled ? "Fulfilled" : "Pending"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Add Product Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products to add..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.barcode}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                    onClick={() => addProduct(product)}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        #{product.barcode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {product.salePrice
                          ? `$${product.salePrice}`
                          : `$${product.price}`}
                      </div>
                      {product.salePrice && (
                        <div className="text-sm text-gray-500 line-through">
                          ${product.price}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Items */}
          <div className="space-y-2">
            <h3 className="font-medium">Order Items</h3>
            {editedItems.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No items in order. Search and add products above.
              </div>
            ) : (
              editedItems.map((item) => (
                <div
                  key={item.barcode}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">#{item.barcode}</div>
                    <div className="text-sm">
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

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(item.barcode, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
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
                      className="w-16 text-center"
                      min="1"
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(item.barcode, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeItem(item.barcode)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Total */}
          {editedItems.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving || editedItems.length === 0}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
