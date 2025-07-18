import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/categories/:id/filters
 * Returns every FilterDef that is enabled for the given category.
 *
 * ⚠️  In Next 15 the `params` object is a *then-able*.
 *     We **must await** it exactly once before reading `id`,
 *     otherwise the build emits ParamCheck errors.
 */
export async function GET(
    _req: Request,
    // 👉 declare `params` as a Promise and await it
    { params }: { params: Promise<{ id: string }> },
) {
    /* satisfy the “await params” rule */
    const { id } = await params;

    const categoryId = Number(id);
    if (Number.isNaN(categoryId)) {
        return NextResponse.json(
            { error: "invalid category id" },
            { status: 400 },
        );
    }

    const defs = await prisma.filterDef.findMany({
        where: { categories: { some: { categoryId } } },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(defs);
}

/* Prisma (Node) runtime needed */
export const dynamic = "force-dynamic";
