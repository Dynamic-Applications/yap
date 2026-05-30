import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// DELETE /api/groups/[id]/leave
// Removes the current user from the group.
// The group creator cannot leave — they must delete the group or transfer ownership first.
export async function DELETE(
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

        // Verify the group exists and the user is a member
        const [membership] = await sql`
            SELECT gm.user_id, g.created_by
            FROM group_members gm
            JOIN groups g ON g.id = gm.group_id
            WHERE gm.group_id = ${groupId} AND gm.user_id = ${userId}
        `;

        if (!membership)
            return NextResponse.json(
                { error: "You are not a member of this group" },
                { status: 404 },
            );

        // Creator cannot leave — they must delete the group or transfer ownership
        if (membership.created_by === userId)
            return NextResponse.json(
                {
                    error: "Group creator cannot leave. Delete the group or transfer ownership first.",
                },
                { status: 400 },
            );

        await sql`
            DELETE FROM group_members
            WHERE group_id = ${groupId} AND user_id = ${userId}
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
