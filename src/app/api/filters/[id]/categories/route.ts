import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*  GET /api/filters/[id]/categories
    → returns an array of category IDs that already use this filter */
export async function GET(
    _req: Request,
    ctx: { params: { id: string } },
) {
    /* ✅ await ctx.params once, then use the value */
    const { id } = await Promise.resolve(ctx.params);
    const filterId = Number(id);
    if (Number.isNaN(filterId))
        return NextResponse.json({ error: "bad id" }, { status: 400 });

    const links = await prisma.categoryFilter.findMany({
        where: { filterId },
        select: { categoryId: true },
    });

    /* plain number[] for the client */
    return NextResponse.json(links.map((l) => l.categoryId));
}
