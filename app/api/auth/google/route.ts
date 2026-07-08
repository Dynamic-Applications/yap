import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(req: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    // Use the callback path that matches the Google Console setting.
    // If you changed the Authorized Redirect URI to `/api/auth/callback/google`,
    // make sure the redirect here matches exactly.
    const redirectUri = `${req.nextUrl.origin}/api/auth/callback/google`;
    console.log("Google auth redirect_uri:", redirectUri);

    if (!clientId) {
        return NextResponse.json(
            { error: "Google client ID is not configured." },
            { status: 500 },
        );
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account",
        access_type: "offline",
    });

    return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
