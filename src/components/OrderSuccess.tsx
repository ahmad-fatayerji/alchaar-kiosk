"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

type OrderSuccessProps = {
  orderNumber: string;
  onReturn: () => void;
};

export default function OrderSuccess({
  orderNumber,
  onReturn,
}: OrderSuccessProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReturn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReturn]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h2>
          <p className="text-gray-600 mb-6">
            Your order has been successfully placed.
          </p>

          {/* Order Number */}
          <div className="bg-[#3da874] text-white rounded-lg p-6 mb-6">
            <div className="text-sm font-medium mb-1">Order Number</div>
            <div className="text-4xl font-bold tracking-wider">
              {orderNumber.slice(-3)}
            </div>
          </div>

          {/* Instructions */}
          <p className="text-gray-600 mb-6">
            Please provide this order number to the cashier to collect your
            items.
          </p>

          {/* Countdown */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Returning to home screen in {countdown} seconds...
            </p>
            <Button
              onClick={onReturn}
              variant="outline"
              className="text-[#3da874] border-[#3da874] hover:bg-[#3da874] hover:text-white"
            >
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
