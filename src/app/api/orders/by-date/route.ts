import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { lebanonDayToUtcRange } from "@/lib/time";

type OrderWithItems = Prisma.OrderGetPayload<{
    include: { items: { include: { product: true } } };
}>;
type OrderItemWithProduct = {
    product: { barcode: bigint; name: string; price: Prisma.Decimal; salePrice: Prisma.Decimal | null };
    qty: number;
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get("date");

        if (!dateStr) {
            return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
        }

        // Interpret the given YYYY-MM-DD as Lebanon local date and convert to UTC range
        const { start: startOfDay, end: endOfDay } = lebanonDayToUtcRange(dateStr);

        const orders: OrderWithItems[] = await db.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Transform the data to handle BigInt serialization
        const serializedOrders = orders.map((order) => {
            const items = order.items as OrderItemWithProduct[];

            return {
                id: Number(order.id),
                orderNumber: order.orderNumber || null,
                createdAt: order.createdAt.toISOString(),
                isFulfilled: Boolean(order.isFulfilled),
                isCancelled: Boolean(order.isCancelled),
                items: items.map((item) => ({
                    barcode: String(item.product.barcode),
                    name: String(item.product.name),
                    quantity: Number(item.qty),
                    price: String(item.product.price),
                    salePrice: item.product.salePrice ? String(item.product.salePrice) : null,
                })),
            };
        });

        return NextResponse.json(serializedOrders);
    } catch (error) {
        console.error("Error fetching orders by date:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
