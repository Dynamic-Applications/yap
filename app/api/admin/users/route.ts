import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/jwt";
import { getAllUsers, findUserById, findUserByEmail } from "@/lib/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

async function getRequestingUser(request: NextRequest) {
    const payload = await getTokenFromRequest(request);
    if (payload) return findUserById(payload.sub);
    const session = await getServerSession(authOptions);
    if (session?.user?.email) return findUserByEmail(session.user.email);
    return null;
}

export async function GET(request: NextRequest) {
    const requester = await getRequestingUser(request);

    if (!requester || !["SuperAdmin", "Admin"].includes(requester.role)) {
        return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 },
        );
    }

    const allUsers = await getAllUsers();

    const filtered = allUsers.filter((u) => {
        if (requester.role === "SuperAdmin") return u.role !== "SuperAdmin";
        if (requester.role === "Admin") return u.role === "User";
        return false;
    });

    return NextResponse.json({ success: true, data: filtered });
}
