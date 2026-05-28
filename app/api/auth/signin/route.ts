import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password)
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 },
            );

        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        const user = result[0];

        if (!user)
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );

        const valid = await comparePassword(password, user.password);
        if (!valid)
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );

        const token = signToken(user.id);

        const res = NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name },
        });
        res.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
        });
        return res;
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
