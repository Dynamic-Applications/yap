import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/jwt";
import { findUserById, findUserByEmail, updateUserRole } from "@/lib/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

async function getRequestingUser(request: NextRequest) {
    const payload = await getTokenFromRequest(request);
    if (payload) return findUserById(payload.sub);
    const session = await getServerSession(authOptions);
    if (session?.user?.email) return findUserByEmail(session.user.email);
    return null;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const requester = await getRequestingUser(request);
    if (!requester || requester.role !== "SuperAdmin") {
        return NextResponse.json(
            {
                success: false,
                error: "Forbidden — only SuperAdmin can change roles",
            },
            { status: 403 },
        );
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!["User", "Admin"].includes(role)) {
        return NextResponse.json(
            { success: false, error: "Invalid role" },
            { status: 400 },
        );
    }

    const target = await findUserById(id);
    if (!target) {
        return NextResponse.json(
            { success: false, error: "User not found" },
            { status: 404 },
        );
    }
    if (target.role === "SuperAdmin") {
        return NextResponse.json(
            { success: false, error: "Cannot modify SuperAdmin" },
            { status: 403 },
        );
    }

    await updateUserRole(id, role);
    return NextResponse.json({
        success: true,
        message: `Role updated to ${role}`,
    });
}
