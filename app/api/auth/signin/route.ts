import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, safeUser } from "@/lib/users";
import { signToken, makeAuthCookie } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Avoid user enumeration — same message for wrong email or wrong password
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(user, password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const safe = safeUser(user);
    const token = await signToken({ sub: safe.id, email: safe.email, name: safe.name });

    const response = NextResponse.json({ success: true, data: { user: safe, token } });
    response.headers.set("Set-Cookie", makeAuthCookie(token));
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
