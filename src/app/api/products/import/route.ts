import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";

/* POST /api/products/import
   Body: multipart/form-data with field "file" (xlsx or csv)
   Sheet format (row1 header optional): Barcode | Name | Stock | Price
*/
export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        // Optional CSV list of barcodes whose names should be updated if different
        const updateNamesRaw = (form.get("updateNames") || "") as string;
        const updateNamesSet = new Set(
            updateNamesRaw
                .split(/[\s,]+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
        );
        if (!file) return NextResponse.json({ error: "file missing" }, { status: 400 });
        if (file.size === 0) return NextResponse.json({ error: "empty file" }, { status: 400 });

        const buf = Buffer.from(await file.arrayBuffer());
        let workbook: XLSX.WorkBook;
        try {
            workbook = XLSX.read(buf, { type: "buffer" });
        } catch {
            return NextResponse.json({ error: "failed to parse workbook" }, { status: 400 });
        }
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return NextResponse.json({ error: "no sheets" }, { status: 400 });
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        if (!rows.length) return NextResponse.json({ error: "sheet empty" }, { status: 400 });

        // Detect header row (if first cell is non-numeric and not a 13+ digit barcode) and skip
        const startIdx = rows[0] && /^\d{6,}$/.test(String(rows[0][0])) ? 0 : 1;

        const results = {
            created: 0,
            updated: 0,
            updatedNames: 0,
            skipped: [] as { row: number; barcode?: string; reason: string }[],
            errors: [] as { row: number; barcode?: string; reason: string }[],
            nameDifferences: [] as { barcode: string; existingName: string; newName: string }[],
        };
        for (let i = startIdx; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 1;
            if (!r || r.every((c) => (c === undefined || c === null || String(c).trim() === ""))) {
                results.skipped.push({ row: rowNum, reason: "empty row" });
                continue;
            }
            if (r.length < 4) {
                results.skipped.push({ row: rowNum, reason: "missing columns (need 4)" });
                continue;
            }
            const [barcodeRaw, nameRaw, stockRaw, priceRaw] = r;
            const barcodeStr = String(barcodeRaw || "").trim();
            const name = String(nameRaw || "").trim();
            const stock = Number(stockRaw ?? 0);
            const priceNum = Number(priceRaw);
            if (!barcodeStr || !/^\d+$/.test(barcodeStr)) { results.errors.push({ row: rowNum, reason: "invalid barcode" }); continue; }
            if (!name) { results.errors.push({ row: rowNum, barcode: barcodeStr, reason: "empty name" }); continue; }
            if (Number.isNaN(stock) || stock < 0) { results.errors.push({ row: rowNum, barcode: barcodeStr, reason: "invalid stock" }); continue; }
            if (Number.isNaN(priceNum) || priceNum < 0) { results.errors.push({ row: rowNum, barcode: barcodeStr, reason: "invalid price" }); continue; }

            const barcode = BigInt(barcodeStr);
            try {
                const existing = await prisma.product.findUnique({ where: { barcode } });
                if (existing) {
                    const nameDifferent = existing.name !== name;
                    const shouldRename = nameDifferent && updateNamesSet.has(barcodeStr);
                    await prisma.product.update({
                        where: { barcode },
                        data: {
                            qtyInStock: stock,
                            price: priceNum,
                            archived: false,
                            ...(shouldRename ? { name } : {}),
                        },
                    });
                    results.updated++;
                    if (shouldRename) results.updatedNames++;
                    else if (nameDifferent) {
                        // collect for possible subsequent confirmation
                        results.nameDifferences.push({
                            barcode: barcodeStr,
                            existingName: existing.name,
                            newName: name,
                        });
                    }
                } else {
                    await prisma.product.create({
                        data: { barcode, name, qtyInStock: stock, price: priceNum, archived: false },
                    });
                    results.created++;
                }
            } catch (e: any) {
                results.errors.push({ row: rowNum, barcode: barcodeStr, reason: e?.message || 'db error' });
            }
        }

        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: "import failed" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";