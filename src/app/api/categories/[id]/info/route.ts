import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* helper – await ctx.params exactly once, then reuse */
async function catId(ctx: { params: Promise<{ id: string }> }): Promise<number> {
    const { id } = await ctx.params;
    const n = Number(id);
    if (Number.isNaN(n)) {
        throw NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    return n;
}

/* ────────── GET /api/categories/[id]/info  (single category info) ────────── */
export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const id = await catId(ctx);

    const category = await prisma.category.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
        },
    });

    if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
}
