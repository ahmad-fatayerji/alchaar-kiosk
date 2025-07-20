import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ────────── GET /api/settings ────────── */
export async function GET() {
    const settings = await prisma.setting.findMany();

    // Convert to key-value object for easier access
    const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObj);
}

/* ────────── POST /api/settings ────────── */
export async function POST(req: Request) {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
        return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
    });

    return NextResponse.json(setting);
}

/* ────────── PATCH /api/settings (bulk update) ────────── */
export async function PATCH(req: Request) {
    const body = await req.json();

    // Expecting { settings: { key1: value1, key2: value2, ... } }
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ error: "Settings object is required" }, { status: 400 });
    }

    // Update multiple settings in a transaction
    const updates = Object.entries(settings).map(([key, value]) =>
        prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
}
