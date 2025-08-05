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

        // Get the order with its items to calculate quantity updates
        const orderWithItems = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!orderWithItems) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (orderWithItems.isFulfilled) {
            return NextResponse.json(
                { error: "Order is already fulfilled" },
                { status: 400 }
            );
        }

        // Check if there's sufficient stock for all items
        const insufficientStock: string[] = [];
        for (const item of orderWithItems.items) {
            if (item.product.qtyInStock < item.qty) {
                insufficientStock.push(`${item.product.name} (Available: ${item.product.qtyInStock}, Required: ${item.qty})`);
            }
        }

        if (insufficientStock.length > 0) {
            return NextResponse.json(
                {
                    error: "Insufficient stock",
                    details: insufficientStock,
                    message: `Cannot fulfill order due to insufficient stock:\n${insufficientStock.join('\n')}`
                },
                { status: 400 }
            );
        }

        // Use transaction to fulfill order and update product quantities atomically
        const result = await prisma.$transaction(async (tx) => {
            // Update product quantities
            for (const item of orderWithItems.items) {
                await tx.product.update({
                    where: { barcode: item.productId },
                    data: {
                        qtyInStock: {
                            decrement: item.qty,
                        },
                    },
                });
            }

            // Mark order as fulfilled
            const order = await tx.order.update({
                where: { id: orderId },
                data: { isFulfilled: true },
            });

            return order;
        });

        // Broadcast the fulfillment update to all connected clients
        broadcastOrderUpdate({
            type: 'order_fulfilled',
            orderId: Number(result.id),
            orderNumber: result.orderNumber,
            date: new Date().toISOString().slice(0, 10)
        });

        return NextResponse.json({
            success: true,
            order: {
                id: Number(result.id),
                orderNumber: result.orderNumber,
                createdAt: result.createdAt.toISOString(),
                isFulfilled: result.isFulfilled,
            },
            quantitiesUpdated: orderWithItems.items.map(item => ({
                barcode: item.productId.toString(),
                productName: item.product.name,
                quantityDeducted: item.qty,
                newStock: item.product.qtyInStock - item.qty,
            })),
        });
    } catch (error) {
        console.error("Error fulfilling order:", error);
        return NextResponse.json(
            { error: "Failed to fulfill order" },
            { status: 500 }
        );
    }
}
