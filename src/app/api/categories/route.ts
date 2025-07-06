// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

// GET  /api/categories   → full tree (2 levels deep for now)
export async function GET() {
    const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: {
            children: {
                include: { children: true }   // second level; deeper can be fetched client-side
            }
        },
        orderBy: { id: "asc" }
    });
    return NextResponse.json(categories);
}

// POST /api/categories   body: { parentId?: number, name: string }
export async function POST(req: Request) {
    const { parentId, name } = await req.json() as { parentId?: number; name?: string };

    if (!name?.trim()) {
        return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const slug = slugify(name);
    const newCat = await prisma.category.create({
        data: { name, slug, parentId: parentId ?? null }
    });

    return NextResponse.json(newCat, { status: 201 });
}
