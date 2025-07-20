import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildProductWhere } from "@/lib/filters"; // already in your repo

/* ──────────────────────────────────────────────────────────
   GET /api/products               (list, optional filters)
   ────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const where = buildProductWhere(searchParams);

    const list = await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { barcode: "asc" },
    });

    /* Prisma returns BigInt & Decimal objects.  Make them JSON-safe. */
    const safe = list.map((p) => ({
        ...p,
        barcode: p.barcode.toString(), // bigint → string
        price: p.price.toString(),   // Decimal → string
        salePrice: p.salePrice?.toString() || null, // Decimal → string or null
    }));

    return NextResponse.json(safe);  // never throws “serialize BigInt”
}

/* ──────────────────────────────────────────────────────────
   POST /api/products               (create)
   ────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
    const body = await req.json();

    // If assigning to a category, validate it's a leaf category
    if (body.categoryId !== null && body.categoryId !== undefined) {
        const children = await prisma.category.findMany({
            where: { parentId: body.categoryId },
            select: { id: true },
        });

        if (children.length > 0) {
            return NextResponse.json(
                { error: "Products can only be assigned to leaf categories (categories without subcategories)" },
                { status: 400 }
            );
        }
    }

    /* Cast the incoming string barcode back to BigInt for Prisma. */
    const prod = await prisma.product.create({
        data: {
            ...body,
            barcode: BigInt(body.barcode),
        },
    });

    /* Same JSON-safe cast for the response    ↓ */
    return NextResponse.json(
        {
            ...prod,
            barcode: prod.barcode.toString(),
            price: prod.price.toString(),
        },
        { status: 201 },
    );
}

/* ──────────────────────────────────────────────────────────
   PATCH /api/products/[barcode]      (update) and DELETE
   keep the same bigint↔string casts in their own route files
   ────────────────────────────────────────────────────────── */
