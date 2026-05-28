import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json({ success: false }, { status: 401 });

        const { userId } = verifyToken(token);
        const result =
            await sql`SELECT id, email, name FROM users WHERE id = ${userId}`;
        const user = result[0];

        if (!user)
            return NextResponse.json({ success: false }, { status: 401 });

        return NextResponse.json({ success: true, user });
    } catch {
        return NextResponse.json({ success: false }, { status: 401 });
    }
}
