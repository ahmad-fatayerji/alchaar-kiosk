import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { broadcastOrderUpdate } from "@/lib/orderSSE";

type OrderWithItems = Prisma.OrderGetPayload<{
    include: { items: { include: { product: true } } };
}>;
type OrderItemWithProduct = {
    productId: bigint;
    qty: number;
    product?: {
        name: string;
        price: Prisma.Decimal;
        salePrice: Prisma.Decimal | null;
    } | null;
};

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

        const order: OrderWithItems | null = await prisma.order.findUnique({
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

        const items = order.items as OrderItemWithProduct[];

        return NextResponse.json({
            id: Number(order.id),
            orderNumber: order.orderNumber,
            createdAt: order.createdAt.toISOString(),
            isFulfilled: order.isFulfilled,
            isCancelled: order.isCancelled,
            items: items.map((item) => ({
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

        if (existingOrder.isCancelled) {
            return NextResponse.json(
                { error: "Cannot edit cancelled orders" },
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
        const ops: Prisma.PrismaPromise<unknown>[] = [
            prisma.orderItem.deleteMany({
                where: { orderId: orderId },
            }),
            prisma.orderItem.createMany({
                data: items.map((item: { barcode: string; quantity: number }) => ({
                    orderId: orderId,
                    productId: BigInt(item.barcode),
                    qty: item.quantity,
                })),
            }),
            prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            }),
        ];

        const results = await prisma.$transaction(ops);
        const updatedOrder = results[2] as OrderWithItems | null;

        if (!updatedOrder) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Format the updated order for response and broadcasting
        const formattedItems = updatedOrder.items as OrderItemWithProduct[];
        const formattedOrder = {
            id: Number(updatedOrder.id),
            orderNumber: updatedOrder.orderNumber,
            createdAt: updatedOrder.createdAt.toISOString(),
            isFulfilled: updatedOrder.isFulfilled,
            isCancelled: updatedOrder.isCancelled,
            items: formattedItems.map((item) => ({
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
