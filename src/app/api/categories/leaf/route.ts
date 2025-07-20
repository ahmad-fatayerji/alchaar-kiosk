import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ────────── GET /api/categories/leaf  (only leaf categories) ────────── */
export async function GET() {
    // Get all categories
    const allCategories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            parentId: true,
        },
        orderBy: { name: "asc" },
    });

    // Find categories that are not parents of any other category
    const parentIds = new Set(allCategories.map(cat => cat.parentId).filter(Boolean));
    const leafCategories = allCategories.filter(cat => !parentIds.has(cat.id));

    return NextResponse.json(leafCategories);
}
