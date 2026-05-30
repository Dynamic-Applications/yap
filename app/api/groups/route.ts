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

        const { name, memberIds, avatarUrl } = await req.json();
        if (!name || !memberIds?.length)
            return NextResponse.json(
                { error: "Name and members required" },
                { status: 400 },
            );

        // Create group
        const [group] = await sql`
            INSERT INTO groups (name, created_by, avatar_url)
            VALUES (${name}, ${userId}, ${avatarUrl ?? null})
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

// PATCH /api/groups/[id] — update group name and/or avatar
// Body: { name?: string, avatarUrl?: string }
// Only the group creator may update group details.
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
        const { name, avatarUrl } = await req.json();

        if (!name && !avatarUrl)
            return NextResponse.json(
                { error: "Nothing to update" },
                { status: 400 },
            );

        // Verify the requester is the group creator
        const [group] = await sql`
            SELECT id FROM groups
            WHERE id = ${groupId} AND created_by = ${userId}
        `;
        if (!group)
            return NextResponse.json(
                { error: "Group not found or permission denied" },
                { status: 403 },
            );

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

// DELETE /api/groups/[id]/members/[memberId] — remove a member from a group
// Only the group creator may remove members; a creator cannot remove themselves.
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> },
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

        const { id: groupId, id: memberId } = await params;

        // Only the group creator can remove members
        const [group] = await sql`
            SELECT id FROM groups
            WHERE id = ${groupId} AND created_by = ${userId}
        `;
        if (!group)
            return NextResponse.json(
                { error: "Group not found or permission denied" },
                { status: 403 },
            );

        // Creator cannot remove themselves
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

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
