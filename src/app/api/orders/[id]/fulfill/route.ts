import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
