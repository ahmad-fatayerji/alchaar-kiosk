import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*  GET /api/filters/[id]/categories
    returns array of category IDs that already use this filter            */
export async function GET(
    _req: Request,
    ctx: { params: { id: string } },
) {
    const filterId = Number(ctx.params.id);
    if (Number.isNaN(filterId))
        return NextResponse.json({ error: "bad id" }, { status: 400 });

    const links = await prisma.categoryFilter.findMany({
        where: { filterId },
        select: { categoryId: true },
    });

    /* plain number[] is enough for the client */
    return NextResponse.json(links.map((l) => l.categoryId));
}
