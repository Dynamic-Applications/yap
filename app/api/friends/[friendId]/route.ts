import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ friendId: string }> },
) {
    try {
        const { friendId } = await params;
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { userId } = verifyToken(token);

        const result = await sql`
            SELECT u.id, u.name, u.email
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = ${userId} AND f.friend_id = ${friendId}
        `;

        const friend = result[0];
        if (!friend)
            return NextResponse.json({ error: "Not friends" }, { status: 404 });

        return NextResponse.json({ success: true, friend });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
