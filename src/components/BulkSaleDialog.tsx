"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { Tag, TrendingDown, X, Percent } from "lucide-react";

type BulkSaleDialogProps = {
  open: boolean;
  selectedBarcodes: string[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkSaleDialog({
  open,
  selectedBarcodes,
  onClose,
  onSuccess,
}: BulkSaleDialogProps) {
  const [saleType, setSaleType] = useState<"fixed" | "percentage">("fixed");
  const [salePrice, setSalePrice] = useState("");
  const [percentage, setPercentage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApplySale = async () => {
    if (saleType === "fixed") {
      if (!salePrice || Number(salePrice) <= 0) {
        alert("Please enter a valid sale price");
        return;
      }
    } else {
      if (!percentage || Number(percentage) <= 0 || Number(percentage) >= 100) {
        alert("Please enter a valid percentage between 1 and 99");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/products/bulk-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcodes: selectedBarcodes,
          saleType: saleType,
          salePrice: saleType === "fixed" ? Number(salePrice) : undefined,
          percentage: saleType === "percentage" ? Number(percentage) : undefined,
          removeSale: false,
        }),
      });

      if (response.ok) {
        onSuccess();
        handleClose();
        setSalePrice("");
        setPercentage("");
        setSaleType("fixed");
      } else {
        const error = await response.json();
        alert(`Failed to apply sale: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Bulk sale failed:", error);
      alert("Failed to apply sale");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSalePrice("");
    setPercentage("");
    setSaleType("fixed");
    onClose();
  };

  const handleRemoveSale = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products/bulk-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcodes: selectedBarcodes,
          removeSale: true,
        }),
      });

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        alert(`Failed to remove sale: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Remove sale failed:", error);
      alert("Failed to remove sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-500" />
            Bulk Sale Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Products Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {selectedBarcodes.length} products selected
              </Badge>
            </div>
            <p className="text-sm text-blue-700">
              Changes will be applied to all selected products
            </p>
          </div>

          {/* Apply Sale Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Apply Sale</Label>
            
            {/* Sale Type Selection */}
            <RadioGroup
              value={saleType}
              onValueChange={(value) => setSaleType(value as "fixed" | "percentage")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="cursor-pointer">Fixed Price</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">Percentage Discount</Label>
              </div>
            </RadioGroup>

            {/* Input based on sale type */}
            {saleType === "fixed" ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter sale price..."
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleApplySale}
                  disabled={loading || !salePrice}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Apply Sale
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="percentage"
                      type="number"
                      step="1"
                      min="1"
                      max="99"
                      placeholder="Enter discount percentage..."
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleApplySale}
                    disabled={loading || !percentage}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Apply {percentage && `${percentage}%`} Discount
                  </Button>
                </div>
                {percentage && (
                  <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                    This will calculate sale prices as {100 - Number(percentage || 0)}% of the original price for each product.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Remove Sale Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Remove Existing Sales
            </Label>
            <Button
              variant="destructive"
              onClick={handleRemoveSale}
              disabled={loading}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              Remove All Sales
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
