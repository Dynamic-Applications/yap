import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        console.log("Token found:", !!token);
        if (!token)
            return NextResponse.json({ success: false }, { status: 401 });

        let userId: string;
        try {
            ({ userId } = verifyToken(token));
            console.log("userId:", userId);
        } catch (err) {
            console.error("Token verification failed:", err);
            return NextResponse.json({ success: false }, { status: 401 });
        }

        // const { userId } = verifyToken(token);
        const result =
            await sql`SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ${userId}`;
        const user = result[0];
        console.log("userId:", userId);

        if (!user)
            return NextResponse.json({ success: false }, { status: 401 });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, created_at: user.created_at } });
    } catch (err) {
        console.error("outer catch:", err);
        return NextResponse.json({ success: false }, { status: 401 });
    }
}
