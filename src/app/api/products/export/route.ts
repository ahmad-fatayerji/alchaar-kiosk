import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

/* GET /api/products/export
   Streams an Excel file with all products. */
export async function GET() {
    const rows = await prisma.product.findMany({
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
            "Content-Disposition": 'attachment; filename="products.xlsx"',
        },
    });
}

/* ensure Node runtime (needs Buffer) */
export const dynamic = "force-dynamic";
