import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink, readdir } from "fs/promises";
import { extname, join } from "path";
// sharp is optional; dynamic import for environments where native module build may fail
let sharpLib: typeof import("sharp") | null = null;
async function getSharp() {
    if (sharpLib) return sharpLib;
    try {
        sharpLib = (await import("sharp")).default as any;
    } catch {
        sharpLib = null;
    }
    return sharpLib;
}

/* POST /api/categories/:id/thumbnail  (field = file) */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const catId = Number(id);
    if (Number.isNaN(catId))
        return NextResponse.json({ error: "bad id" }, { status: 400 });

    let form: FormData;
    try {
        form = await req.formData();
    } catch (e) {
        return NextResponse.json({ error: "invalid form data" }, { status: 400 });
    }

    const file = form.get("file") as File | null;
    if (!file)
        return NextResponse.json({ error: "file missing" }, { status: 400 });

    if (file.size === 0)
        return NextResponse.json({ error: "empty file" }, { status: 400 });

    // 12MB safety cap
    if (file.size > 12 * 1024 * 1024)
        return NextResponse.json({ error: "file too large (max 12MB)" }, { status: 413 });

    const origExt = (extname(file.name) || ".jpg").toLowerCase();
    if (origExt === ".svg")
        return NextResponse.json({ error: "SVG not allowed" }, { status: 400 });

    const dir = join(process.cwd(), "public", "categories");
    await mkdir(dir, { recursive: true });
    const baseName = String(catId);
    const allExts = ["webp", "jpg", "jpeg", "png", "avif"];

    let inputBuffer: Buffer;
    try {
        inputBuffer = Buffer.from(await file.arrayBuffer());
    } catch {
        return NextResponse.json({ error: "read failure" }, { status: 400 });
    }

    // Probe & load via sharp; fall back to direct write if unsupported format
    let image: any | null = null;
    try {
        const sharp = await getSharp();
        if (sharp) {
            image = sharp(inputBuffer, { failOnError: false }).rotate();
            const meta = await image.metadata();
            if (!meta.width || !meta.height)
                throw new Error("no-dims");
        } else {
            image = null;
        }
    } catch {
        image = null; // we'll just save the original as-is
    }

    try {
        // Clean existing variants first
        const existing = await readdir(dir);
        await Promise.all(
            existing
                .filter((f) => f.startsWith(baseName + "."))
                .map((f) => unlink(join(dir, f)).catch(() => { }))
        );

        if (image) {
            // Normalize: resize largest side to 800px to cap size
            const resized = image.resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true });
            const tasks: Promise<any>[] = [];
            tasks.push(
                resized.clone().webp({ quality: 82 }).toFile(join(dir, `${baseName}.webp`)),
            );
            tasks.push(
                resized.clone().avif({ quality: 60 }).toFile(join(dir, `${baseName}.avif`)).catch(() => { })
            );
            tasks.push(
                resized.clone().jpeg({ quality: 85 }).toFile(join(dir, `${baseName}.jpg`)),
            );
            await Promise.all(tasks);
        } else {
            // Unsupported by sharp – just persist original extension
            await writeFile(join(dir, `${baseName}${origExt}`), inputBuffer);
        }
    } catch (e) {
        return NextResponse.json({ error: "write failure" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}

/* Node runtime */
export const dynamic = "force-dynamic";
