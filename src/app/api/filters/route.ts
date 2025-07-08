import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { FilterType } from "@prisma/client";   // 👈 enum comes from the client

/* ─────────── GET: list all filter defs ─────────── */
export async function GET() {
    const defs = await prisma.filterDef.findMany({
        include: { categories: true },
        orderBy: { id: "asc" },
    });

    return NextResponse.json(
        defs.map(d => ({ ...d, catCount: d.categories.length })),
    );
}

/* ─────────── POST: create new filter def ─────────── */
export async function POST(req: Request) {
    const { name, type, units } =
        (await req.json()) as { name?: string; type?: string; units?: string };

    if (!name?.trim() || !["RANGE", "NUMBER", "LABEL"].includes(type ?? "")) {
        return NextResponse.json(
            { error: "name & valid type required" },
            { status: 400 },
        );
    }

    const created = await prisma.filterDef.create({
        data: {
            name,
            // ✅ cast the string to the enum the Prisma client expects
            type: type as FilterType,
            units: units?.trim() || null,
        },
    });

    return NextResponse.json(created, { status: 201 });
}
