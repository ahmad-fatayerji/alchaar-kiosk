/* ------------------------------------------------------------------ */
/*  PATCH /api/products/:barcode        – update OR report “not-found” */
/*  DELETE /api/products/:barcode       – delete                       */
/*  (Node runtime – fs / Prisma)                                      */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* helper – read `ctx.params` exactly once, then reuse */
async function code(
    ctx: { params: Promise<{ barcode: string }> },
): Promise<bigint> {
    const { barcode } = await ctx.params;               // ✅ awaited
    if (!/^\d+$/.test(barcode))
        throw NextResponse.json({ error: "bad barcode" }, { status: 400 });

    return BigInt(barcode);
}

/* ───────────── PATCH (update) ───────────── */
export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ barcode: string }> },
) {
    const data = await req.json();

    try {
        const updated = await prisma.product.update({
            where: { barcode: await code(ctx) },
            data,
        });

        /* BigInt / Decimal → JSON-safe strings */
        return NextResponse.json({
            ...updated,
            barcode: updated.barcode.toString(),
            price: updated.price.toString(),
        });
    } catch (err: any) {
        /* P2025 = row doesn’t exist → tell client with 404, not 500 */
        if (err.code === "P2025") {
            return NextResponse.json({ error: "not-found" }, { status: 404 });
        }
        throw err; // unknown error ⇒ let Next.js log it
    }
}

/* ───────────── DELETE ───────────── */
export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ barcode: string }> },
) {
    const barcode = await code(ctx);
    // If product is referenced by orders, archive instead of hard-deleting
    try {
        const hasOrders = await prisma.orderItem.findFirst({ where: { productId: barcode }, select: { orderId: true } });
        if (hasOrders) {
            const updated = await prisma.product.update({
                where: { barcode },
                data: { archived: true, qtyInStock: 0 },
            });
            return NextResponse.json({ ok: true, action: "archived", barcode: updated.barcode.toString() });
        }

        await prisma.$transaction([
            prisma.productFilterValue.deleteMany({ where: { productId: barcode } }),
            prisma.product.delete({ where: { barcode } }),
        ]);
        return NextResponse.json({ ok: true, action: "deleted" });
    } catch (err: any) {
        if (err?.code === "P2025") {
            return NextResponse.json({ error: "not-found" }, { status: 404 });
        }
        throw err;
    }
}

/* Prisma & fs need the Node runtime */
export const dynamic = "force-dynamic";
