import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getId(ctx: { params: { id: string } }): bigint {
    const n = BigInt(ctx.params.id);
    return n;
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
    const data = await req.json();
    const updated = await prisma.product.update({
        where: { barcode: getId(ctx) },
        data,
    });
    return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
    await prisma.product.delete({ where: { barcode: getId(ctx) } });
    return NextResponse.json({ ok: true });
}
