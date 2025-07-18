import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

/* ------------------------------------------------------------------ */
/*  POST /api/products/:barcode/thumbnail                              */
/*  Body: multipart/form-data   field = file                           */
/* ------------------------------------------------------------------ */
export async function POST(
    req: Request,
    // ⚠️  params is a Promise in Next 15 – declare & await it
    { params }: { params: Promise<{ barcode: string }> },
) {
    const { barcode } = await params;                    // ✅ awaited
    if (!/^\d+$/.test(barcode)) {
        return NextResponse.json({ error: "bad barcode" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "file missing" }, { status: 400 });
    }

    /* block SVG for security */
    const ext = (extname(file.name) || ".jpg").toLowerCase();
    if (ext === ".svg") {
        return NextResponse.json({ error: "SVG not allowed" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    /* write to /public/products/{barcode}.{ext} */
    const dir = join(process.cwd(), "public", "products");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${barcode}${ext}`), buf);

    return NextResponse.json({ ok: true });
}

/* Prisma / fs need Node runtime */
export const dynamic = "force-dynamic";
