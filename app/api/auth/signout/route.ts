import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/jwt";
import { blacklistToken } from "@/lib/tokenBlacklist";

export async function POST(request: NextRequest) {
    const cookie = request.cookies.get("auth_token")?.value;
    if (cookie) {
        await blacklistToken(cookie);
    }

    const response = NextResponse.json({
        success: true,
        message: "Signed out",
    });

    // clear custom JWT
    response.headers.append("Set-Cookie", clearAuthCookie());

    // clear all NextAuth cookies
    const cookiesToClear = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Host-next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.callback-url",
    ];

    cookiesToClear.forEach((name) => {
        response.headers.append(
            "Set-Cookie",
            `${name}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
        );
        // also try with Secure flag for production
        response.headers.append(
            "Set-Cookie",
            `${name}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure`,
        );
    });

    return response;
}
