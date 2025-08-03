import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get("date");

        if (!dateStr) {
            return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
        }

        // Parse the date and get start/end of day
        const date = new Date(dateStr);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const orders = await db.order.findMany({
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
        const serializedOrders = orders.map((order) => ({
            id: Number(order.id),
            orderNumber: order.orderNumber || null,
            createdAt: order.createdAt.toISOString(),
            isFulfilled: Boolean(order.isFulfilled),
            items: order.items.map((item) => ({
                barcode: String(item.product.barcode),
                name: String(item.product.name),
                quantity: Number(item.qty),
                price: String(item.product.price),
                salePrice: item.product.salePrice ? String(item.product.salePrice) : null,
            })),
        }));

        return NextResponse.json(serializedOrders);
    } catch (error) {
        console.error("Error fetching orders by date:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
