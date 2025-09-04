import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ------------------------------------------------------------------
   POST /api/categories/reorder
   body: { parentId: number | null, orderedIds: number[] }
   Reassigns sequential sortOrder (1..n) to provided sibling ids.
-------------------------------------------------------------------*/
export async function POST(req: Request) {
    try {
        const { parentId, orderedIds } = (await req.json()) as {
            parentId: number | null;
            orderedIds: number[];
        };

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
        }

        // Validate that all ids belong to the same parent
        const existing = await prisma.category.findMany({
            where: { id: { in: orderedIds } },
            select: { id: true, parentId: true },
        });
        if (existing.length !== orderedIds.length) {
            return NextResponse.json({ error: "some ids not found" }, { status: 400 });
        }
        const mismatch = existing.find((c) => c.parentId !== parentId);
        if (mismatch) {
            return NextResponse.json({ error: "parentId mismatch" }, { status: 400 });
        }

        await prisma.$transaction(
            orderedIds.map((id, idx) =>
                prisma.category.update({
                    where: { id },
                    data: { sortOrder: idx + 1 },
                })
            )
        );

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("/api/categories/reorder failed", e);
        return NextResponse.json({ error: "reorder_failed" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";