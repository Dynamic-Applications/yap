import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// DELETE /api/groups/[id]/leave
// Any non-admin member can leave freely.
// The admin must transfer ownership first (PATCH /api/groups/[id] with newAdminId).
// Auto-deletes the group if no members remain.
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

        // Admin must transfer ownership before leaving
        if (membership.created_by === userId)
            return NextResponse.json(
                { error: "Transfer admin to another member before leaving." },
                { status: 400 },
            );

        await sql`
            DELETE FROM group_members
            WHERE group_id = ${groupId} AND user_id = ${userId}
        `;

        // Auto-delete the group if no members remain
        const [{ count }] = await sql`
            SELECT COUNT(*) as count FROM group_members WHERE group_id = ${groupId}
        `;
        if (Number(count) === 0) {
            await sql`DELETE FROM groups WHERE id = ${groupId}`;
            return NextResponse.json({ success: true, groupDeleted: true });
        }

        return NextResponse.json({ success: true, groupDeleted: false });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
