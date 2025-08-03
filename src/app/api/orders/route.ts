import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { broadcastOrderUpdate } from "@/lib/orderSSE";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
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

        // Generate daily order number before creating the order
        const today = new Date();

        // Calculate day of year (1-366)
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today.getTime() - start.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        // Count orders created today
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const dailyOrderCount = await prisma.order.count({
            where: {
                createdAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
            },
        });

        // Generate 8-digit order number: YYDDDSSS format
        // YY = year (24-99), DDD = day of year (001-366), SSS = daily sequence (001-999)
        const yearStr = (today.getFullYear() % 100).toString().padStart(2, '0');
        const dayStr = dayOfYear.toString().padStart(3, '0');
        const seqStr = (dailyOrderCount + 1).toString().padStart(3, '0');
        const orderNumber = `${yearStr}${dayStr}${seqStr}`;

        // Create the order with the generated order number
        const order = await prisma.order.create({
            data: {
                orderNumber,
                items: {
                    create: items.map((item: { barcode: string; quantity: number }) => ({
                        productId: BigInt(item.barcode),
                        qty: item.quantity,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Format order data for broadcasting
        const formattedOrder = {
            id: Number(order.id),
            orderNumber: order.orderNumber || order.id.toString().padStart(4, '0'),
            createdAt: order.createdAt.toISOString(),
            isFulfilled: order.isFulfilled,
            items: order.items.map((item: any) => ({
                barcode: item.product.barcode.toString(),
                name: item.product.name,
                quantity: item.qty,
                price: item.product.price.toString(),
                salePrice: item.product.salePrice?.toString() || null,
            })),
        };

        // Broadcast the new order to all connected clients
        broadcastOrderUpdate({
            type: 'new_order',
            order: formattedOrder,
            date: new Date().toISOString().slice(0, 10) // Today's date for filtering
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: orderNumber, // Use the generated orderNumber
            createdAt: order.createdAt,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderNumber = searchParams.get("orderNumber");

        if (!orderNumber) {
            return NextResponse.json(
                { error: "Order number is required" },
                { status: 400 }
            );
        }

        // Convert order number to search for order
        let order;

        // If it's a 3-digit number, search by the last 3 digits (SSS)
        if (orderNumber.length === 3) {
            // Get today's date to search within today's orders
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            order = await prisma.order.findFirst({
                where: {
                    orderNumber: {
                        endsWith: orderNumber
                    },
                    createdAt: {
                        gte: todayStart,
                        lt: todayEnd,
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        } else {
            // First try to find by full orderNumber (new system)
            order = await prisma.order.findUnique({
                where: { orderNumber: orderNumber },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        }

        // If not found, try legacy system (order ID padded to 4 digits)
        if (!order) {
            const orderId = parseInt(orderNumber);
            if (!isNaN(orderId)) {
                order = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                });
            }
        }

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Format the response
        const formattedOrder = {
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
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}
