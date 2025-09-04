import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/* ------------------------------------------------------------------
   GET /api/categories                → root categories (+1 level)
-------------------------------------------------------------------*/
export async function GET() {
    try {
        /** grab root + one level, but also ask for `_count` so we know
            if *any* child has further kids */
        const roots = await prisma.category.findMany({
            where: { parentId: null },
            include: {
                _count: { select: { children: true } },
                children: {
                    include: { _count: { select: { children: true } } },
                    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
                }
            },
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
        });

        // convert `_count.children` → `hasChildren`  (recursive)
        const withFlags = roots.map(flagLeafs);
        return NextResponse.json(withFlags);           // 200 OK
    } catch (e: any) {
        console.error("/api/categories GET failed", e);
        return NextResponse.json({ error: "categories_fetch_failed" }, { status: 500 });
    }
}

/* helper ───────────────────────────────────────────────────────── */
function flagLeafs(cat: any): any {
    const { _count, ...rest } = cat;
    const hasChildren = (_count?.children ?? 0) > 0;

    return {
        ...rest,
        hasChildren,
        children: cat.children?.map(flagLeafs)
    };
}

/* ------------------------------------------------------------------
   POST /api/categories               → create new category
   body: { name: string, parentId?: number }
-------------------------------------------------------------------*/
export async function POST(req: Request) {
    const { name, parentId, arabicName } = (await req.json()) as {
        name?: string;
        arabicName?: string | null;
        parentId?: number;
    };

    if (!name?.trim()) {
        return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    // Create category; if it's a subcategory, ensure the parent no longer holds products
    const created = await prisma.$transaction(async (tx) => {
        // determine next sortOrder within the sibling group
        const maxSibling = await tx.category.findFirst({
            where: { parentId: parentId ?? null },
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
        });
        const nextOrder = (maxSibling?.sortOrder ?? 0) + 1;

        const cat = await tx.category.create({
            data: {
                name,
                slug: slugify(name),
                parentId: parentId ?? null,
                arabicName: arabicName?.trim() || null,
                sortOrder: nextOrder,
            },
        });

        if (parentId != null) {
            await tx.product.updateMany({
                where: { categoryId: parentId },
                data: { categoryId: null },
            });
        }

        return cat;
    });

    return NextResponse.json(created, { status: 201 });
}
