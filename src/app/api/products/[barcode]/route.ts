import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* -------------------------------------------------- */
/* helper – await ctx.params once, return BigInt code */
/* -------------------------------------------------- */
async function code(
    ctx: { params: Promise<{ barcode: string }> },   // ← note the key name
): Promise<bigint> {
    const { barcode } = await ctx.params;           // ✅ awaited exactly once
    try {
        return BigInt(barcode);
    } catch {
        throw NextResponse.json({ error: "invalid barcode" }, { status: 400 });
    }
}

/* ───────── PATCH /api/products/:barcode  (update) ───────── */
export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ barcode: string }> },
) {
    const data = await req.json();
    const updated = await prisma.product.update({
        where: { barcode: await code(ctx) },
        data,
    });
    return NextResponse.json(updated);
}

/* ───────── DELETE /api/products/:barcode (remove) ───────── */
export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ barcode: string }> },
) {
    await prisma.product.delete({ where: { barcode: await code(ctx) } });
    return NextResponse.json({ ok: true });
}

/* Prisma (Node) runtime */
export const dynamic = "force-dynamic";
