import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ─────────────────────────────────────────
   POST  { categoryId, filterId }  → link
   DELETE { categoryId, filterId } → unlink
   ───────────────────────────────────────── */
export async function POST(req: Request) {
    const { categoryId, filterId } = (await req.json()) as {
        categoryId?: number;
        filterId?: number;
    };

    if (!categoryId || !filterId)
        return NextResponse.json(
            { error: "categoryId & filterId required" },
            { status: 400 },
        );

    await prisma.categoryFilter.create({
        data: { categoryId, filterId },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
    const { categoryId, filterId } = (await req.json()) as {
        categoryId?: number;
        filterId?: number;
    };

    if (!categoryId || !filterId)
        return NextResponse.json(
            { error: "categoryId & filterId required" },
            { status: 400 },
        );

    await prisma.categoryFilter.delete({
        where: { categoryId_filterId: { categoryId, filterId } },
    });

    return NextResponse.json({ ok: true });
}
