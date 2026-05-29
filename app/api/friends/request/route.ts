import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { userId: senderId } = verifyToken(token);
        const { email } = await req.json();

        if (!email)
            return NextResponse.json(
                { error: "Email required" },
                { status: 400 },
            );

        // Get sender info
        const [sender] =
            await sql`SELECT name, email FROM users WHERE id = ${senderId}`;

        // Check if target email belongs to an existing user
        const [receiver] =
            await sql`SELECT id, name FROM users WHERE email = ${email}`;

        // No account — send invite email instead
        if (!receiver) {
            await sendInviteEmail({ toEmail: email, senderName: sender.name });
            return NextResponse.json({ success: true, invited: true });
        }

        if (receiver.id === senderId)
            return NextResponse.json(
                { error: "You can't add yourself" },
                { status: 400 },
            );

        // Check if already friends
        const [alreadyFriends] = await sql`
            SELECT id FROM friends WHERE user_id = ${senderId} AND friend_id = ${receiver.id}
        `;
        if (alreadyFriends)
            return NextResponse.json(
                { error: "Already friends" },
                { status: 409 },
            );

        // Check if request already exists
        const [existing] = await sql`
            SELECT id FROM friend_requests WHERE sender_id = ${senderId} AND receiver_id = ${receiver.id}
        `;
        if (existing)
            return NextResponse.json(
                { error: "Request already sent" },
                { status: 409 },
            );

        // Create request
        const [request] = await sql`
            INSERT INTO friend_requests (sender_id, receiver_id)
            VALUES (${senderId}, ${receiver.id})
            RETURNING id
        `;

        await pusher.trigger(`user-${receiver.id}`, "friend-request", {
            requestId: request.id,
            senderId,
            senderName: sender.name,
            senderEmail: sender.email,
        });

        return NextResponse.json({ success: true, invited: false });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
