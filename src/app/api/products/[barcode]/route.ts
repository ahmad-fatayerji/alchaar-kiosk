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
    await prisma.product.delete({ where: { barcode: await code(ctx) } });
    return NextResponse.json({ ok: true });
}

/* Prisma & fs need the Node runtime */
export const dynamic = "force-dynamic";
