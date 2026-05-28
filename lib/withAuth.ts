import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, JWTPayload } from "@/lib/jwt";

type Handler = (
    req: NextRequest,
    ctx: { params: Record<string, string>; user: JWTPayload },
) => Promise<NextResponse>;

export function withAuth(handler: Handler) {
    return async (
        req: NextRequest,
        ctx: {
            params: Promise<Record<string, string>> | Record<string, string>;
        },
    ): Promise<NextResponse> => {
        const user = await getTokenFromRequest(req);
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized — please sign in" },
                { status: 401 },
            );
        }
        const params = await Promise.resolve(ctx.params);
        return handler(req, { params, user });
    };
}
