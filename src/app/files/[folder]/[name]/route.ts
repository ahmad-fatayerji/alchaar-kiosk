// src/app/files/[folder]/[name]/route.ts
import { NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";

/**
 * Streams any file inside /public/<folder>/<name> with **no caching**.
 * Example URL:  /files/products/123.webp
 */
export async function GET(
    _req: Request,
    ctx: { params: Promise<{ folder: string; name: string }> },
) {
    const { folder, name } = await ctx.params;          // ← awaited exactly once

    /* basic safety – prevent “…/../” traversal */
    const safe = /^[a-z0-9._-]+$/i;
    if (!safe.test(folder) || !safe.test(name))
        return new NextResponse("Bad path", { status: 400 });

    try {
        const filePath = join(process.cwd(), "public", folder, name);
        const buf = await readFile(filePath);

        /* crude content-type from extension */
        const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
        const type =
            ext === "png" ? "image/png" :
                ext === "jpg" ||
                    ext === "jpeg" ? "image/jpeg" :
                    ext === "webp" ? "image/webp" :
                        "application/octet-stream";

        return new NextResponse(new Uint8Array(buf), {
            headers: {
                "Content-Type": type,
                "Cache-Control": "no-store",   // 👈 disable all caching
            },
        });
    } catch {
        return new NextResponse("Not found", { status: 404 });
    }
}

/* Node runtime needed (fs) */
export const dynamic = "force-dynamic";
