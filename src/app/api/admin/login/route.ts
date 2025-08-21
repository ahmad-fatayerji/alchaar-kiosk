import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // Server-side env vars work at runtime
        const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin';

        if (password === adminPass && password.length > 0) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
}
