import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getFilterId(raw: { params: { id: string } }): Promise<number> {
    const { id } = await Promise.resolve(raw.params);   // ✅ awaited
    const num = Number(id);
    if (Number.isNaN(num)) {
        throw NextResponse.json({ error: "bad id" }, { status: 400 });
    }
    return num;
}

export async function GET(
    _req: Request,
    ctx: { params: { id: string } },
) {
    const filterId = await getFilterId(ctx);

    const rows = await prisma.categoryFilter.findMany({
        where: { filterId },
        select: { categoryId: true },
    });

    return NextResponse.json(rows.map(r => r.categoryId));
}
