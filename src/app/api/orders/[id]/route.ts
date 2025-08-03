import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { broadcastOrderUpdate } from "@/lib/orderSSE";

export async function GET(
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

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: Number(order.id),
            orderNumber: order.orderNumber,
            createdAt: order.createdAt.toISOString(),
            isFulfilled: order.isFulfilled,
            items: order.items.map((item) => ({
                barcode: item.productId.toString(),
                name: item.product?.name || "Unknown Product",
                quantity: item.qty,
                price: item.product?.price?.toString() || "0",
                salePrice: item.product?.salePrice?.toString() || null,
            })),
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

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

        // Check if order exists and is not fulfilled
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (existingOrder.isFulfilled) {
            return NextResponse.json(
                { error: "Cannot edit fulfilled orders" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: "Items are required" },
                { status: 400 }
            );
        }

        // Validate items structure
        for (const item of items) {
            if (!item.barcode || !item.quantity || item.quantity <= 0) {
                return NextResponse.json(
                    { error: "Each item must have a valid barcode and quantity > 0" },
                    { status: 400 }
                );
            }
        }

        // Update order items using a transaction
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Delete existing order items
            await tx.orderItem.deleteMany({
                where: { orderId: orderId },
            });

            // Create new order items
            const orderItems = await tx.orderItem.createMany({
                data: items.map((item: { barcode: string; quantity: number }) => ({
                    orderId: orderId,
                    productId: BigInt(item.barcode),
                    qty: item.quantity,
                })),
            });

            // Return updated order with items
            return await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });

        // Format the updated order for response and broadcasting
        const formattedOrder = {
            id: Number(updatedOrder!.id),
            orderNumber: updatedOrder!.orderNumber,
            createdAt: updatedOrder!.createdAt.toISOString(),
            isFulfilled: updatedOrder!.isFulfilled,
            items: updatedOrder!.items.map((item) => ({
                barcode: item.productId.toString(),
                name: item.product?.name || "Unknown Product",
                quantity: item.qty,
                price: item.product?.price?.toString() || "0",
                salePrice: item.product?.salePrice?.toString() || null,
            })),
        };

        // Broadcast the order update to all connected clients
        broadcastOrderUpdate({
            type: 'order_updated',
            order: formattedOrder,
            date: new Date().toISOString().slice(0, 10)
        });

        return NextResponse.json({
            success: true,
            order: formattedOrder,
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}
