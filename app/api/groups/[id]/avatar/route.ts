import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { put, del } from "@vercel/blob";

// POST /api/groups/[id]/avatar — upload a new group avatar
// Replaces the existing blob if one is already set, then updates the group row.
// Only the group creator may change the avatar.
export async function POST(
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

        // Verify ownership and fetch the current avatar so we can delete the old blob
        const [group] = await sql`
            SELECT id, avatar_url FROM groups
            WHERE id = ${groupId} AND created_by = ${userId}
        `;
        if (!group)
            return NextResponse.json(
                { error: "Group not found or permission denied" },
                { status: 403 },
            );

        const formData = await req.formData();
        const file = formData.get("avatar") as File;
        if (!file)
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );

        // Upload new blob
        const blob = await put(`groups/${groupId}/${Date.now()}`, file, {
            access: "public",
            contentType: file.type,
        });

        // Persist the new URL on the group
        await sql`
            UPDATE groups SET avatar_url = ${blob.url} WHERE id = ${groupId}
        `;

        // Delete the old blob after the new one is safely stored
        if (group.avatar_url) {
            try {
                await del(group.avatar_url);
            } catch (delErr) {
                // Non-fatal: log but don't fail the request
                console.warn("Failed to delete old avatar blob:", delErr);
            }
        }

        return NextResponse.json({ success: true, avatarUrl: blob.url });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// DELETE /api/groups/[id]/avatar — remove the group avatar entirely
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

        const [group] = await sql`
            SELECT id, avatar_url FROM groups
            WHERE id = ${groupId} AND created_by = ${userId}
        `;
        if (!group)
            return NextResponse.json(
                { error: "Group not found or permission denied" },
                { status: 403 },
            );

        if (!group.avatar_url)
            return NextResponse.json(
                { error: "No avatar to remove" },
                { status: 400 },
            );

        await del(group.avatar_url);

        await sql`
            UPDATE groups SET avatar_url = NULL WHERE id = ${groupId}
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
