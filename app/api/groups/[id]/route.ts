import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET /api/groups/[id]
// Returns full group details including the members list.
// Requester must be a member of the group.
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
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

        const { id: groupId } = await params;

        // Fetch the group — also confirms the requester is a member
        const [group] = await sql`
            SELECT g.id, g.name, g.avatar_url, g.created_by, g.created_at
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            WHERE g.id = ${groupId} AND gm.user_id = ${userId}
        `;

        if (!group)
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 },
            );

        // Fetch all members with their profile info
        const members = await sql`
            SELECT u.id, u.name, u.email,
                   (u.id = ${group.created_by}) AS "isCreator"
            FROM users u
            JOIN group_members gm ON gm.user_id = u.id
            WHERE gm.group_id = ${groupId}
            ORDER BY "isCreator" DESC, u.name ASC
        `;

        return NextResponse.json({
            success: true,
            group: { ...group, members },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
