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
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

/* Prisma uses Node runtime */
export const dynamic = "force-dynamic";
