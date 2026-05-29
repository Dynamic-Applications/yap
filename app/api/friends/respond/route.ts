import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { userId } = verifyToken(token);
        const { requestId, action } = await req.json(); // action: "accept" | "reject"

        const requestResult = await sql`
            SELECT * FROM friend_requests WHERE id = ${requestId} AND receiver_id = ${userId}
        `;
        const friendRequest = requestResult[0];
        if (!friendRequest)
            return NextResponse.json(
                { error: "Request not found" },
                { status: 404 },
            );

        if (action === "accept") {
            // Add both directions to friends table
            await sql`
                INSERT INTO friends (user_id, friend_id) VALUES (${userId}, ${friendRequest.sender_id})
                ON CONFLICT DO NOTHING
            `;
            await sql`
                INSERT INTO friends (user_id, friend_id) VALUES (${friendRequest.sender_id}, ${userId})
                ON CONFLICT DO NOTHING
            `;

            // Notify sender
            await pusher.trigger(
                `user-${friendRequest.sender_id}`,
                "friend-accepted",
                {
                    userId,
                },
            );
        }

        // Update request status
        await sql`
            UPDATE friend_requests SET status = ${action === "accept" ? "accepted" : "rejected"}
            WHERE id = ${requestId}
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
