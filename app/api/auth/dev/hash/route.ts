import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const hash = await hashPassword("password123");
    return NextResponse.json({ hash });
}
