import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

/* ------------------------------------------------------------------ */
/* POST /api/categories/:id/thumbnail                                 */
/* Body: multipart/form-data  field = file                            */
/* ------------------------------------------------------------------ */
export async function POST(
    req: Request,
    // ✅ declare params as a Promise and await it
    { params }: { params: Promise<{ id: string }> },
) {
    /* satisfy “await params” rule */
    const { id } = await params;
    const catId = Number(id);
    if (Number.isNaN(catId)) {
        return NextResponse.json({ error: "bad id" }, { status: 400 });
    }

    /* file from form-data */
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "file missing" }, { status: 400 });
    }

    /* block SVG for safety */
    const ext = (extname(file.name) || ".jpg").toLowerCase();
    if (ext === ".svg") {
        return NextResponse.json({ error: "SVG not allowed" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    /* save to /public/categories/{id}.{ext} */
    const dir = join(process.cwd(), "public", "categories");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${catId}${ext}`), buf);

    return NextResponse.json({ ok: true });
}

/* Node runtime required (fs) */
export const dynamic = "force-dynamic";
