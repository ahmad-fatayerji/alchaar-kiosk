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
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { isFulfilled: true },
        });

        // Broadcast the fulfillment update to all connected clients
        broadcastOrderUpdate({
            type: 'order_fulfilled',
            orderId: Number(order.id),
            orderNumber: order.orderNumber,
            date: new Date().toISOString().slice(0, 10)
        });

        return NextResponse.json({
            success: true,
            order: {
                id: Number(order.id),
                orderNumber: order.orderNumber,
                createdAt: order.createdAt.toISOString(),
                isFulfilled: order.isFulfilled,
            },
        });
    } catch (error) {
        console.error("Error fulfilling order:", error);
        return NextResponse.json(
            { error: "Failed to fulfill order" },
            { status: 500 }
        );
    }
}
