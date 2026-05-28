import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/users";

export const GET = async () => {
  return NextResponse.json({ success: true, data: getAllUsers() });
};