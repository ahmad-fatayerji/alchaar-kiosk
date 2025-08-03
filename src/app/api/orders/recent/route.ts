import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Fetch the last 10 orders with their items and products
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Format the response
        const formattedOrders = orders.map((order) => ({
            id: Number(order.id),
            orderNumber: order.orderNumber || order.id.toString().padStart(4, '0'), // Fallback for legacy orders
            createdAt: order.createdAt.toISOString(),
            isFulfilled: order.isFulfilled,
            items: order.items.map((item: any) => ({
                barcode: item.product.barcode.toString(),
                name: item.product.name,
                quantity: item.qty,
                price: item.product.price.toString(),
                salePrice: item.product.salePrice?.toString() || null,
            })),
        })); return NextResponse.json(formattedOrders);
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent orders" },
            { status: 500 }
        );
    }
}
