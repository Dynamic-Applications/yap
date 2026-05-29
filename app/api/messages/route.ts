import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { userId } = verifyToken(token);
        const { message, name, channel } = await req.json();

        // Save to DB
        await sql`
            INSERT INTO messages (channel, sender_id, message)
            VALUES (${channel}, ${userId}, ${message})
        `;

        // Trigger Pusher
        await pusher.trigger(channel, "message", {
            message,
            userId,
            name,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        
         try {
             verifyToken(token);
         } catch {
             return NextResponse.json(
                 { error: "Unauthorized" },
                 { status: 401 },
             );
         }

        const { searchParams } = new URL(req.url);
        const channel = searchParams.get("channel");
        if (!channel)
            return NextResponse.json(
                { error: "Channel required" },
                { status: 400 },
            );

        const messages = await sql`
            SELECT m.id, m.message, m.created_at, m.sender_id, u.name
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.channel = ${channel}
            ORDER BY m.created_at ASC
        `;

        return NextResponse.json({ success: true, messages });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
