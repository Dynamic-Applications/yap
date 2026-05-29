import { NextRequest, NextResponse } from "next/server";
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

        let userId: string;
        try {
            ({ userId } = verifyToken(token));
        } catch {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { name, memberIds } = await req.json();
        if (!name || !memberIds?.length)
            return NextResponse.json(
                { error: "Name and members required" },
                { status: 400 },
            );

        // Create group
        const [group] = await sql`
            INSERT INTO groups (name, created_by)
            VALUES (${name}, ${userId})
            RETURNING id
        `;

        // Add creator + all selected members
        const allMembers = [...new Set([userId, ...memberIds])];
        for (const memberId of allMembers) {
            await sql`
                INSERT INTO group_members (group_id, user_id)
                VALUES (${group.id}, ${memberId})
            `;
        }

        return NextResponse.json({ success: true, groupId: group.id });
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

        let userId: string;
        try {
            ({ userId } = verifyToken(token));
        } catch {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const groups = await sql`
            SELECT g.id, g.name, g.avatar_url, g.created_at
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = ${userId}
            ORDER BY g.created_at DESC
        `;

        return NextResponse.json({ success: true, groups });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
