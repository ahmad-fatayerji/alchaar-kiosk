import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*  GET /api/filters/:id/categories
    → returns an array of category IDs that already use this filter       */
export async function GET(
    _req: Request,
    // 👉 `params` is a Promise in Next 15 – declare and await it
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;               // ✅ awaited before use
    const filterId = Number(id);
    if (Number.isNaN(filterId)) {
        return NextResponse.json({ error: "bad id" }, { status: 400 });
    }

    const links = await prisma.categoryFilter.findMany({
        where: { filterId },
        select: { categoryId: true },
    });

    /* plain number[] is enough for the client */
    return NextResponse.json(links.map((l) => l.categoryId));
}

/* Prisma requires the Node runtime */
export const dynamic = "force-dynamic";
