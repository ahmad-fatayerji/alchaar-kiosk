import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } } };
}>;

type OrderItemWithProduct = {
  product: {
    barcode: bigint;
    name: string;
    price: Prisma.Decimal;
    salePrice: Prisma.Decimal | null;
  };
  qty: number;
};

export async function GET() {
  try {
    const orders: OrderWithItems[] = await db.order.findMany({
      where: {
        isFulfilled: false,
        isCancelled: false,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

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
          salePrice: item.product.salePrice
            ? String(item.product.salePrice)
            : null,
        })),
      };
    });

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending orders" },
      { status: 500 }
    );
  }
}
