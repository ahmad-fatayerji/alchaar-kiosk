import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type In = {
    productBarcode: string; // barcode as string for convenience
    values: {
        filterId: number;
        labelVal?: string | null;
        numberVal?: number | null;
        rangeFrom?: number | null;
        rangeTo?: number | null;
    }[];
};

export async function POST(req: Request) {
    const { productBarcode, values } = (await req.json()) as In;

    if (!productBarcode || !Array.isArray(values))
        return Response.json({ error: "bad payload" }, { status: 400 });

    const productId = BigInt(productBarcode);
    const keep = values.map((v) => v.filterId);

    await prisma.$transaction(async (tx) => {
        /* delete rows that were cleared in the dialog */
        await tx.productFilterValue.deleteMany({
            where: {
                productId,
                NOT: { filterId: { in: keep } },
            },
        });

        /* upsert the submitted rows */
        const ups: Prisma.ProductFilterValueUpsertArgs[] = values.map((v) => ({
            where: { productId_filterId: { productId, filterId: v.filterId } },
            create: { productId, ...v },
            update: { ...v },
        }));

        for (const args of ups) await tx.productFilterValue.upsert(args);
    });

    return Response.json({ ok: true });
}
