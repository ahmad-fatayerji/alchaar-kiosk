/* ------------------------------------------------------------------ */
/*  DELETE /api/products/bulk   – bulk delete products                 */
/*  Body: { codes: string[] }                                          */
/*  Note: Runs per-item deletes to avoid aborting on conflicts.        */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type BulkBody = { codes?: string[] };

export async function DELETE(req: Request) {
  let body: BulkBody;
  try {
    body = (await req.json()) as BulkBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const codes = Array.isArray(body.codes) ? body.codes : [];
  if (!codes.length) {
    return NextResponse.json({ error: "codes required" }, { status: 400 });
  }

  const deleted: string[] = [];
  const archived: string[] = [];
  const notFound: string[] = [];
  const conflicts: string[] = [];
  const invalid: string[] = [];

  // Process one by one so a conflict doesn't abort the rest
  for (const code of codes) {
    if (!/^\d+$/.test(code)) {
      invalid.push(code);
      continue;
    }
    const barcode = BigInt(code);
    try {
      const hasOrders = await prisma.orderItem.findFirst({ where: { productId: barcode }, select: { orderId: true } });
      if (hasOrders) {
        await prisma.product.update({ where: { barcode }, data: { archived: true, qtyInStock: 0 } });
        archived.push(code);
        continue;
      }
      await prisma.$transaction([
        prisma.productFilterValue.deleteMany({ where: { productId: barcode } }),
        prisma.product.delete({ where: { barcode } }),
      ]);
      deleted.push(code);
    } catch (err: any) {
      if (err?.code === "P2025") { notFound.push(code); continue; }
      if (err?.code === "P2003") { conflicts.push(code); continue; }
      throw err;
    }
  }

  return NextResponse.json({ ok: true, deleted, archived, notFound, conflicts, invalid });
}

export const dynamic = "force-dynamic";
