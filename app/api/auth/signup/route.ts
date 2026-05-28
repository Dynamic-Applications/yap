import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password)
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 },
            );

        if (password.length < 8)
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 },
            );

        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existing.rows.length > 0)
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 409 },
            );

        const hashed = await hashPassword(password);
        const result = await sql`
            INSERT INTO users (email, password, name)
            VALUES (${email}, ${hashed}, ${name ?? null})
            RETURNING id, email, name
        `;
        const user = result.rows[0];
        const token = signToken(user.id);

        const res = NextResponse.json({ success: true, user });
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
