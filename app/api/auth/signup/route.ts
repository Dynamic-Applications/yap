import { NextRequest, NextResponse } from "next/server";
import { createUser, emailExists } from "@/lib/users";
import { signToken, makeAuthCookie } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Name must be at least 2 characters" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (await emailExists(email)) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }

    const user = await createUser(email, name, password);
    const token = await signToken({ sub: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({ success: true, message: "User created successfully", data: { user, token } }, { status: 201 });
    response.headers.set("Set-Cookie", makeAuthCookie(token));
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
