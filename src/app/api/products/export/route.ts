import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

/* GET /api/products/export
   Streams an Excel file with products, optionally filtered by category. */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const catParam = searchParams.get("cat");
    const where: Prisma.ProductWhereInput = {};

    if (catParam && /^\d+$/.test(catParam)) {
        where.categoryId = Number(catParam);
    }

    const rows: Array<{
        barcode: bigint;
        name: string;
        qtyInStock: number;
        price: Prisma.Decimal;
    }> = await prisma.product.findMany({
        where,
        select: { barcode: true, name: true, qtyInStock: true, price: true },
        orderBy: { barcode: "asc" },
    });

    /* build 2-D array */
    const data = [
        ["Barcode", "Name", "Stock", "Price"],
        ...rows.map((p) => [
            p.barcode.toString(),
            p.name,
            p.qtyInStock,
            p.price.toString(),
        ]),
    ];

    /* SheetJS → Buffer */
    const sheet = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Products");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filenameForExport(
                catParam
            )}"`,
        },
    });
}

function filenameForExport(catParam: string | null) {
    if (catParam && /^\d+$/.test(catParam)) return `products-category-${catParam}.xlsx`;
    return "products.xlsx";
}

/* ensure Node runtime (needs Buffer) */
export const dynamic = "force-dynamic";
