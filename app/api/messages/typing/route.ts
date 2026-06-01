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
        const { channel, typing } = await req.json();
        if (!channel || typeof typing !== "boolean") {
            return NextResponse.json(
                { error: "Channel and typing are required" },
                { status: 400 },
            );
        }

        const [sender] = await sql`
            SELECT name, avatar_url FROM users WHERE id = ${userId}
        `;

        await pusher.trigger(channel, "typing", {
            userId,
            name: sender?.name ?? null,
            avatar_url: sender?.avatar_url ?? null,
            typing,
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
