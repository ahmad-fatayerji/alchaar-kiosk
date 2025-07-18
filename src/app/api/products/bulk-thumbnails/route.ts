import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

/*  POST /api/products/bulk-thumbnails
    Body: multipart/form-data  field = files[]
    Each file name must contain the numeric barcode            */
export async function POST(req: Request) {
    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (files.length === 0) {
        return NextResponse.json(
            { error: "no files received – field must be 'files'" },
            { status: 400 }
        );
    }

    /* guarantees the folder exists only once */
    const dir = join(process.cwd(), "public", "products");
    await mkdir(dir, { recursive: true });

    const saved: string[] = [];
    const errors: { file: string; error: string }[] = [];

    await Promise.all(
        files.map(async (file) => {
            try {
                const name = file.name.toLowerCase();
                const code = name.match(/\d+/)?.[0]; // first digit-run
                if (!code) throw new Error("filename has no digits (barcode)");

                const ext = (extname(name) || ".jpg").toLowerCase();
                if (ext === ".svg") throw new Error("svg not allowed");

                const buf = Buffer.from(await file.arrayBuffer());
                await writeFile(join(dir, `${code}${ext}`), buf);
                saved.push(code);
            } catch (err: any) {
                errors.push({ file: file.name, error: err.message });
            }
        })
    );

    return NextResponse.json({ saved, errors });
}

/* needs Node runtime */
export const dynamic = "force-dynamic";
