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

// DELETE /api/friends/[friendId] — unfriend a user
// Removes both directions from the friends table.
export async function DELETE(
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

        // Verify they are actually friends before deleting
        const [friendship] = await sql`
            SELECT 1 FROM friends
            WHERE user_id = ${userId} AND friend_id = ${friendId}
        `;
        if (!friendship)
            return NextResponse.json({ error: "Not friends" }, { status: 404 });

        // Remove both directions
        await sql`
            DELETE FROM friends
            WHERE (user_id = ${userId} AND friend_id = ${friendId})
               OR (user_id = ${friendId} AND friend_id = ${userId})
        `;

        // Clean up any accepted friend requests between the two users
        await sql`
            DELETE FROM friend_requests
            WHERE (sender_id = ${userId} AND receiver_id = ${friendId})
               OR (sender_id = ${friendId} AND receiver_id = ${userId})
        `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
