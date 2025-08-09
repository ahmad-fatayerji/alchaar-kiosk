import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/* helper – await ctx.params exactly once, then reuse */
async function catId(ctx: { params: Promise<{ id: string }> }): Promise<number> {
    const { id } = await ctx.params;          // ✅ awaited
    const n = Number(id);
    if (Number.isNaN(n)) {
        throw NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    return n;
}

/* ────────── GET /api/categories/[id]  (direct children) ────────── */
export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const parentId = await catId(ctx);

    const children = await prisma.category.findMany({
        where: { parentId },
        orderBy: { id: "asc" },
    });
    return NextResponse.json(children);
}

/* ────────── PATCH (rename) ────────── */
export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const id = await catId(ctx);
    const { name } = (await req.json()) as { name?: string };

    if (!name?.trim()) {
        return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const updated = await prisma.category.update({
        where: { id },
        data: { name, slug: slugify(name) },
    });
    return NextResponse.json(updated);
}

/* ────────── DELETE (cascade) ────────── */
export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const id = await catId(ctx);

    // Ensure no descendant categories block deletion. We'll perform a small recursive cleanup:
    // - Set categoryId = null for products under this category or its descendants
    // - Delete categoryFilter links for this category and descendants
    // - Then delete descendants and finally this category

    // Gather descendants (simple BFS in SQL)
    const toVisit: number[] = [id];
    const allIds: number[] = [];
    while (toVisit.length) {
        const batch = toVisit.splice(0, 50);
        allIds.push(...batch);
        const children = await prisma.category.findMany({
            where: { parentId: { in: batch } },
            select: { id: true },
        });
        toVisit.push(...children.map((c) => c.id));
    }

    await prisma.$transaction([
        // Detach products
        prisma.product.updateMany({ where: { categoryId: { in: allIds } }, data: { categoryId: null } }),
        // Remove category-filter links
        prisma.categoryFilter.deleteMany({ where: { categoryId: { in: allIds } } }),
        // Delete categories bottom-up (children first)
        prisma.category.deleteMany({ where: { id: { in: allIds.filter((x) => x !== id) } } }),
        prisma.category.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
}

/* Prisma uses Node runtime */
export const dynamic = "force-dynamic";
