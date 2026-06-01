import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { userId } = verifyToken(token);

        const friends = await sql`
            SELECT u.id, u.name, u.email, u.avatar_url
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = ${userId}
        `;

        const pending = await sql`
            SELECT fr.id, fr.created_at, u.name, u.email, u.id as sender_id
            FROM friend_requests fr
            JOIN users u ON u.id = fr.sender_id
            WHERE fr.receiver_id = ${userId} AND fr.status = 'pending'
        `;

        return NextResponse.json({ success: true, friends, pending });
    } catch (err) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
