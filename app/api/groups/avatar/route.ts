import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { put } from "@vercel/blob";

// POST /api/groups/avatar — upload avatar during group creation (no group ID yet)
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        try {
            verifyToken(token);
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

        const blob = await put(`groups/${Date.now()}`, file, {
            access: "public",
            contentType: file.type,
        });

        return NextResponse.json({ success: true, avatarUrl: blob.url });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
