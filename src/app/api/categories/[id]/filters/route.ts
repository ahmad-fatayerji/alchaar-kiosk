import prisma from "@/lib/prisma";

/* GET /api/categories/:id/filters */
export async function GET(
    _req: Request,
    ctx: { params: { id: string } },
) {
    // ✅ satisfy the “await params” rule once, then use the value
    const { id } = await Promise.resolve(ctx.params);
    const num = Number(id);
    if (Number.isNaN(num))
        return new Response("invalid category id", { status: 400 });

    const defs = await prisma.filterDef.findMany({
        where: { categories: { some: { categoryId: num } } },
        orderBy: { name: "asc" },
    });

    return Response.json(defs);
}
