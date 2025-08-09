/* ------------------------------------------------------------------ */
/* src/app/api/filters/[id]/route.ts                                   */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { FilterType } from "@prisma/client"; // enum comes from Prisma

/* helper – await ctx.params once, then reuse */
async function filterId(
    ctx: { params: Promise<{ id: string }> },
): Promise<number> {
    const { id } = await ctx.params;        // ✅ awaited
    const n = Number(id);
    if (Number.isNaN(n)) {
        throw NextResponse.json({ error: "bad id" }, { status: 400 });
    }
    return n;
}

/* ─────────── PATCH  /api/filters/:id           (rename / units) ─────────── */
export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const id = await filterId(ctx);
    const { name, units } =
        (await req.json()) as { name?: string; units?: string };

    const updated = await prisma.filterDef.update({
        where: { id },
        data: { name, units: units?.trim() || null },
    });

    return NextResponse.json(updated);
}

/* ─────────── DELETE /api/filters/:id                                ────── */
export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const id = await filterId(ctx);
    await prisma.$transaction([
        prisma.categoryFilter.deleteMany({ where: { filterId: id } }),
        prisma.productFilterValue.deleteMany({ where: { filterId: id } }),
        prisma.filterDef.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
}

/* ─────────── POST   /api/filters/:id           (change type) ───────────── */
export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const id = await filterId(ctx);
    const { type } = (await req.json()) as { type?: string };

    if (!["RANGE", "NUMBER", "LABEL"].includes(type ?? "")) {
        return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }

    const updated = await prisma.filterDef.update({
        where: { id },
        data: { type: type as FilterType },
    });

    return NextResponse.json(updated);
}

/* Prisma (Node) runtime required */
export const dynamic = "force-dynamic";
