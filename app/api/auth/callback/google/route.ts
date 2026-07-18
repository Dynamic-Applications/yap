import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/users";
import { signToken } from "@/lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function redirectWithError(host: string, error: string, description?: string) {
    const url = new URL("/auth/signin", host);
    url.searchParams.set("error", error);
    if (description) {
        url.searchParams.set("error_description", description);
    }
    return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");
    const errorDescription = req.nextUrl.searchParams.get("error_description");
    const host = req.nextUrl.origin;

    if (error || !code) {
        return redirectWithError(
            host,
            error === "access_denied"
                ? "google-access-denied"
                : "google-callback-error",
            errorDescription ?? undefined,
        );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        console.error("Google OAuth credentials are not configured.");
        return redirectWithError(host, "google-config-missing");
    }

    const redirectUri = `${host}/api/auth/callback/google`;

    let tokenResponse: Response;
    try {
        tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
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
    } catch (err) {
        console.error("Google token exchange failed:", err);
        return redirectWithError(host, "google-token-exchange-failed");
    }

    if (!tokenResponse.ok) {
        const responseText = await tokenResponse.text();
        console.error(
            "Google token exchange failed:",
            tokenResponse.status,
            responseText,
        );
        return redirectWithError(host, "google-token-exchange-failed");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
        console.error("Google token response did not include an access token.");
        return redirectWithError(host, "google-token-exchange-failed");
    }

    let userInfoResponse: Response;
    try {
        userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
    } catch (err) {
        console.error("Google userinfo request failed:", err);
        return redirectWithError(host, "google-userinfo-failed");
    }

    if (!userInfoResponse.ok) {
        const responseText = await userInfoResponse.text();
        console.error(
            "Google userinfo request failed:",
            userInfoResponse.status,
            responseText,
        );
        return redirectWithError(host, "google-userinfo-failed");
    }

    const userInfo = (await userInfoResponse.json()) as {
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
    };

    if (!userInfo.email || !userInfo.email_verified) {
        console.error(
            "Google userinfo did not include a verified email.",
            userInfo,
        );
        return redirectWithError(host, "google-userinfo-failed");
    }

    const email = userInfo.email.toLowerCase().trim();
    const name = userInfo.name?.trim() || email.split("@")[0];
    const avatarUrl = userInfo.picture;

    try {
        let user = await findUserByEmail(email);
        if (!user) {
            try {
                user = await createUser(
                    email,
                    name,
                    crypto.randomUUID(),
                    avatarUrl,
                );
            } catch (createErr) {
                if (createErr instanceof Error) {
                    console.error(
                        "Error creating user from Google profile:",
                        createErr.stack,
                    );
                } else {
                    console.error(
                        "Error creating user from Google profile:",
                        createErr,
                    );
                }
                throw createErr;
            }
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
    } catch (err) {
        console.error("Failed to create or load the signed-in user:", err);
        return redirectWithError(host, "google-user-creation-failed");
    }
}
