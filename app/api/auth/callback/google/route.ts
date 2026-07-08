import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/users";
import { signToken } from "@/lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");
    const host = req.nextUrl.origin;

    if (error || !code) {
        return NextResponse.redirect(new URL("/auth/signin", host));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL("/auth/signin", host));
    }

    const redirectUri = `${host}/api/auth/callback/google`;

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
        }),
    });

    if (!tokenResponse.ok) {
        return NextResponse.redirect(new URL("/auth/signin", host));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
        return NextResponse.redirect(new URL("/auth/signin", host));
    }

    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!userInfoResponse.ok) {
        return NextResponse.redirect(new URL("/auth/signin", host));
    }

    const userInfo = (await userInfoResponse.json()) as {
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
    };

    if (!userInfo.email || !userInfo.email_verified) {
        return NextResponse.redirect(new URL("/auth/signin", host));
    }

    const email = userInfo.email.toLowerCase().trim();
    const name = userInfo.name?.trim() || email.split("@")[0];
    const avatarUrl = userInfo.picture;

    let user = await findUserByEmail(email);
    if (!user) {
        user = await createUser(email, name, crypto.randomUUID(), avatarUrl);
    }

    const token = signToken(user.id);
    const response = NextResponse.redirect(new URL("/chat", host));
    response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}
