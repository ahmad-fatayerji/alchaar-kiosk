import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import { extname, join } from "path";

/* POST /api/products/:barcode/thumbnail  (field = file) */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ barcode: string }> },
) {
    const { barcode } = await params;                // params is Promise in Next 15
    if (!/^\d+$/.test(barcode))
        return NextResponse.json({ error: "bad barcode" }, { status: 400 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file)
        return NextResponse.json({ error: "file missing" }, { status: 400 });

    /* block SVG for safety */
    const ext = (extname(file.name) || ".jpg").toLowerCase();
    if (ext === ".svg")
        return NextResponse.json({ error: "SVG not allowed" }, { status: 400 });

    const dir = join(process.cwd(), "public", "products");
    await mkdir(dir, { recursive: true });

    /* 🚮 delete previous thumbnails with any other extension */
    const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
    await Promise.all(
        exts
            .filter((e) => e !== ext)
            .map((e) =>
                unlink(join(dir, `${barcode}${e}`)).catch(() => { }) /* ignore ENOENT */,
            ),
    );

    /* write new file */
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, `${barcode}${ext}`), buf);

    return NextResponse.json({ ok: true });
}

/* Node runtime */
export const dynamic = "force-dynamic";
