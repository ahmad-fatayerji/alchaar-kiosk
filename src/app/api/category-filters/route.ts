import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    const { categoryId, filterId } =
        (await req.json()) as { categoryId?: number; filterId?: number };

    if (!categoryId || !filterId) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    try {
        await prisma.categoryFilter.create({ data: { categoryId, filterId } });
    } catch (e) {
        // ignore duplicate-key error (already linked)
        if (
            !(e instanceof Prisma.PrismaClientKnownRequestError) ||
            e.code !== "P2002"
        )
            throw e;
    }
    return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
    const { categoryId, filterId } =
        (await req.json()) as { categoryId?: number; filterId?: number };

    if (!categoryId || !filterId) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    await prisma.categoryFilter.delete({
        where: { categoryId_filterId: { categoryId, filterId } },
    });
    return NextResponse.json({ ok: true });
}
