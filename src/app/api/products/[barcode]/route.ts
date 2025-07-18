import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* helper – await params once, then cast to BigInt */
async function getBarcode(
    ctx: { params: { barcode: string } },
): Promise<bigint> {
    const { barcode } = await Promise.resolve(ctx.params);
    return BigInt(barcode);
}

/* ---------- UPDATE ---------- */
export async function PATCH(
    req: Request,
    ctx: { params: { barcode: string } },
) {
    const data = await req.json();

    const updated = await prisma.product.update({
        where: { barcode: await getBarcode(ctx) },
        data,
    });

    /* BigInt & Decimal → strings so Next can serialise */
    return NextResponse.json({
        ...updated,
        barcode: updated.barcode.toString(),
        price: updated.price.toString(),
    });
}

/* ---------- DELETE ---------- */
export async function DELETE(
    _req: Request,
    ctx: { params: { barcode: string } },
) {
    await prisma.product.delete({ where: { barcode: await getBarcode(ctx) } });
    return NextResponse.json({ ok: true });
}
