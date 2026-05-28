import { NextRequest, NextResponse } from "next/server";
import { findUserById, safeUser } from "@/lib/users";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (_request: NextRequest, ctx) => {
    if (ctx.user.sub !== ctx.params.id) {
        return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 },
        );
    }

    const user = await findUserById(ctx.params.id);
    if (!user) {
        return NextResponse.json(
            { success: false, error: "User not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ success: true, data: safeUser(user) });
});
