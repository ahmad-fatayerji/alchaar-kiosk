import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    const { name } = await request.json();
    const cat = await prisma.category.update({
        where: { id },
        data: { name, slug: slugify(name) }
    });
    return NextResponse.json(cat);
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
