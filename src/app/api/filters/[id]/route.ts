import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { FilterType } from "@prisma/client";

async function getId(raw: { params: { id: string } }): Promise<number> {
    const { id } = await Promise.resolve(raw.params);   // ✅ awaited
    const num = Number(id);
    if (Number.isNaN(num)) {
        throw NextResponse.json({ error: "bad id" }, { status: 400 });
    }
    return num;
}

/* PATCH: rename / units */
export async function PATCH(
    req: Request,
    ctx: { params: { id: string } },
) {
    const id = await getId(ctx);
    const { name, units } =
        (await req.json()) as { name?: string; units?: string };

    const updated = await prisma.filterDef.update({
        where: { id },
        data: { name, units: units?.trim() || null },
    });

    return NextResponse.json(updated);
}

/* DELETE */
export async function DELETE(
    _req: Request,
    ctx: { params: { id: string } },
) {
    const id = await getId(ctx);
    await prisma.filterDef.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

/* POST: (optional) change type */
export async function POST(
    req: Request,
    ctx: { params: { id: string } },
) {
    const id = await getId(ctx);
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
