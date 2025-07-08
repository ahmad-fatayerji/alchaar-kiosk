import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/* ------------------------------------------------------------------
   GET /api/categories                → root categories (+1 level)
-------------------------------------------------------------------*/
export async function GET() {
    /** grab root + one level, but also ask for `_count` so we know
        if *any* child has further kids */
    const roots = await prisma.category.findMany({
        where: { parentId: null },
        include: {
            _count: { select: { children: true } },
            children: {
                include: { _count: { select: { children: true } } },
                orderBy: { id: "asc" }
            }
        },
        orderBy: { id: "asc" }
    });

    /* convert `_count.children` → `hasChildren`  (recursive) */
    const withFlags = roots.map(flagLeafs);

    return NextResponse.json(withFlags);           // 200 OK
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
    const { name, parentId } = (await req.json()) as {
        name?: string;
        parentId?: number;
    };

    if (!name?.trim()) {
        return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const created = await prisma.category.create({
        data: {
            name,
            slug: slugify(name),
            parentId: parentId ?? null
        }
    });

    return NextResponse.json(created, { status: 201 });
}
