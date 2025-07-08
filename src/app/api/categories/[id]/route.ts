import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

// small helper – satisfies the “await params” rule once, then reuse
async function getId(raw: { params: { id: string } }) {
    const { id } = await Promise.resolve(raw.params);    // 👈 one await
    const num = Number(id);
    if (Number.isNaN(num))
        throw NextResponse.json({ error: "invalid id" }, { status: 400 });
    return num;
}

/* ────────── GET /api/categories/[id]  (direct children) ────────── */
export async function GET(
    _req: Request,
    ctx: { params: { id: string } }
) {
    const parentId = await getId(ctx);

    const children = await prisma.category.findMany({
        where: { parentId },
        orderBy: { id: "asc" },
    });
    return NextResponse.json(children);
}

/* ────────── PATCH (rename) ────────── */
export async function PATCH(
    req: Request,
    ctx: { params: { id: string } }
) {
    const id = await getId(ctx);
    const { name } = (await req.json()) as { name?: string };

    if (!name?.trim())
        return NextResponse.json({ error: "name required" }, { status: 400 });

    const updated = await prisma.category.update({
        where: { id },
        data: { name, slug: slugify(name) },
    });
    return NextResponse.json(updated);
}

/* ────────── DELETE (remove, cascade) ────────── */
export async function DELETE(
    _req: Request,
    ctx: { params: { id: string } }
) {
    const id = await getId(ctx);
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
