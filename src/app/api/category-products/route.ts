import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/* POST body:
   {
     categoryId: number | null,      // target category (null = un-categorise)
     add?:    (string|number)[],     // barcodes to move INTO that category
     remove?: (string|number)[]      // barcodes to set categoryId = null
   }
*/
export async function POST(req: Request) {
    const { categoryId, add = [], remove = [] } = (await req.json()) as {
        categoryId: number | null;
        add?: (string | number)[];
        remove?: (string | number)[];
    };

    // If assigning to a category, validate it's a leaf category
    if (categoryId !== null) {
        const children = await prisma.category.findMany({
            where: { parentId: categoryId },
            select: { id: true },
        });

        if (children.length > 0) {
            return NextResponse.json(
                { error: "Products can only be assigned to leaf categories (categories without subcategories)" },
                { status: 400 }
            );
        }
    }

    const tx: Prisma.PrismaPromise<any>[] = [];

    if (add.length) {
        tx.push(
            prisma.product.updateMany({
                where: { barcode: { in: add.map((c) => BigInt(c)) } },
                data: { categoryId },
            }),
        );
    }

    if (remove.length && categoryId !== null) {
        // only valid when Product.categoryId is nullable
        tx.push(
            prisma.product.updateMany({
                where: { barcode: { in: remove.map((c) => BigInt(c)) } },
                data: { categoryId: null },
            }),
        );
    }

    await prisma.$transaction(tx);
    return NextResponse.json({ ok: true });
}
