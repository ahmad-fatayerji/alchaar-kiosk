import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { broadcastOrderUpdate } from "@/lib/orderSSE";

type OrderItemWithProduct = {
    productId: bigint;
    qty: number;
    product: { qtyInStock: number; name: string };
};

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
        const orderWithItems: Prisma.OrderGetPayload<{
            include: { items: { include: { product: true } } };
        }> | null = await prisma.order.findUnique({
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
        if (orderWithItems.isCancelled) {
            return NextResponse.json(
                { error: "Cannot fulfill a cancelled order" },
                { status: 400 }
            );
        }

        const items = orderWithItems.items as OrderItemWithProduct[];

        const showQuantitiesSetting = await prisma.setting.findUnique({
            where: { key: "show_quantities" },
            select: { value: true },
        });
        const showQuantities = showQuantitiesSetting?.value === "true";
        // Check if there's sufficient stock for all items
        const insufficientStock: string[] = [];
        for (const item of items) {
            if (item.product.qtyInStock < item.qty) {
                insufficientStock.push(
                    showQuantities
                        ? `${item.product.name} (Available: ${item.product.qtyInStock}, Required: ${item.qty})`
                        : item.product.name
                );
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
        const ops: Prisma.PrismaPromise<unknown>[] = items.map((item) =>
            prisma.product.update({
                where: { barcode: item.productId },
                data: {
                    qtyInStock: {
                        decrement: item.qty,
                    },
                },
            }),
        );

        ops.push(
            prisma.order.update({
                where: { id: orderId },
                data: { isFulfilled: true },
            }),
        );

        const results = await prisma.$transaction(ops);
        const result = results[results.length - 1] as Prisma.OrderGetPayload<{}>;

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
                isCancelled: result.isCancelled,
            },
            quantitiesUpdated: items.map(item => ({
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
