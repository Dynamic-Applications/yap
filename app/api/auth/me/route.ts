import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/jwt";
import { findUserByEmail, findUserById } from "@/lib/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest) {
    // check custom JWT first
    const payload = await getTokenFromRequest(request);
    if (payload) {
        const user = await findUserById(payload.sub);
        if (user) {
            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    createdAt: user.createdAt,
                },
            });
        }
    }

    // check NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    return NextResponse.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl ?? session.user.image ?? undefined,
            role: user.role,
            createdAt: user.createdAt,
        },
    });
}
