import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
    const { message, userId, name } = await req.json();

    await pusher.trigger("chat", "message", {
        message,
        userId,
        name,
        timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
}
