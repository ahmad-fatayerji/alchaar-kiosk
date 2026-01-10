import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { broadcastOrderUpdate } from "@/lib/orderSSE";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.isCancelled) {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      );
    }

    if (existingOrder.isFulfilled) {
      return NextResponse.json(
        { error: "Cannot cancel a fulfilled order" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isCancelled: true },
    });

    const formattedOrder = {
      id: Number(updatedOrder.id),
      orderNumber: updatedOrder.orderNumber,
      createdAt: updatedOrder.createdAt.toISOString(),
      isFulfilled: updatedOrder.isFulfilled,
      isCancelled: updatedOrder.isCancelled,
    };

    broadcastOrderUpdate({
      type: "order_cancelled",
      order: formattedOrder,
      date: new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
