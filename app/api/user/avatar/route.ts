import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { put } from "@vercel/blob";

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

        const formData = await req.formData();
        const file = formData.get("avatar") as File;
        if (!file)
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );

        // Upload to Vercel Blob
        const blob = await put(`avatars/${userId}`, file, {
            access: "public",
            contentType: file.type,
        });

        // Save URL to DB
        await sql`
            UPDATE users SET avatar_url = ${blob.url}, updated_at = now()
            WHERE id = ${userId}
        `;

        return NextResponse.json({ success: true, avatarUrl: blob.url });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
