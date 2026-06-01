import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET /api/groups/[id]
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

        const [group] = await sql`
            SELECT g.id, g.name, g.avatar_url, g.created_by, g.created_at, u.name AS "created_by_name"
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            JOIN users u ON u.id = g.created_by
            WHERE g.id = ${groupId} AND gm.user_id = ${userId}
        `;

        if (!group)
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 },
            );

        const members = await sql`
            SELECT u.id, u.name, u.email, u.avatar_url,
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

// PATCH /api/groups/[id] — update name, avatar, or transfer admin
// Body: { name?: string, avatarUrl?: string, newAdminId?: string }
export async function PATCH(
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
        const { name, avatarUrl, newAdminId } = await req.json();

        if (!name && !avatarUrl && !newAdminId)
            return NextResponse.json(
                { error: "Nothing to update" },
                { status: 400 },
            );

        const [group] = await sql`
            SELECT id, created_by FROM groups
            WHERE id = ${groupId} AND created_by = ${userId}
        `;
        if (!group)
            return NextResponse.json(
                { error: "Group not found or permission denied" },
                { status: 403 },
            );

        // Transfer admin ownership
        if (newAdminId) {
            const [isMember] = await sql`
                SELECT 1 FROM group_members
                WHERE group_id = ${groupId} AND user_id = ${newAdminId}
            `;
            if (!isMember)
                return NextResponse.json(
                    { error: "New admin must be a member of the group" },
                    { status: 400 },
                );

            await sql`
                UPDATE groups SET created_by = ${newAdminId} WHERE id = ${groupId}
            `;

            return NextResponse.json({ success: true, newAdminId });
        }

        const [updated] = await sql`
            UPDATE groups
            SET
                name       = COALESCE(${name ?? null}, name),
                avatar_url = COALESCE(${avatarUrl ?? null}, avatar_url)
            WHERE id = ${groupId}
            RETURNING id, name, avatar_url
        `;

        return NextResponse.json({ success: true, group: updated });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// DELETE /api/groups/[id] — remove a member from a group
// Body: { memberId: string }
// Auto-deletes the group if no members remain after removal.
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
        const { memberId } = await req.json();

        if (!memberId)
            return NextResponse.json(
                { error: "memberId required" },
                { status: 400 },
            );

        const [group] = await sql`
            SELECT id FROM groups
            WHERE id = ${groupId} AND created_by = ${userId}
        `;
        if (!group)
            return NextResponse.json(
                { error: "Group not found or permission denied" },
                { status: 403 },
            );

        if (memberId === userId)
            return NextResponse.json(
                { error: "Cannot remove the group creator" },
                { status: 400 },
            );

        const result = await sql`
            DELETE FROM group_members
            WHERE group_id = ${groupId} AND user_id = ${memberId}
            RETURNING user_id
        `;

        if (!result.length)
            return NextResponse.json(
                { error: "Member not found in group" },
                { status: 404 },
            );

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
