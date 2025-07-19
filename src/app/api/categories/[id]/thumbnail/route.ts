import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import { extname, join } from "path";

/* POST /api/categories/:id/thumbnail  (field = file) */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const catId = Number(id);
    if (Number.isNaN(catId))
        return NextResponse.json({ error: "bad id" }, { status: 400 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file)
        return NextResponse.json({ error: "file missing" }, { status: 400 });

    const ext = (extname(file.name) || ".jpg").toLowerCase();
    if (ext === ".svg")
        return NextResponse.json({ error: "SVG not allowed" }, { status: 400 });

    const dir = join(process.cwd(), "public", "categories");
    await mkdir(dir, { recursive: true });

    /* 🚮 delete previous thumbnails with any other extension */
    const exts = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
    await Promise.all(
        exts
            .filter((e) => e !== ext)
            .map((e) =>
                unlink(join(dir, `${catId}${e}`)).catch(() => { }) /* ignore ENOENT */,
            ),
    );

    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, `${catId}${ext}`), buf);

    return NextResponse.json({ ok: true });
}

/* Node runtime */
export const dynamic = "force-dynamic";
