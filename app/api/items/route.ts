import { NextRequest, NextResponse } from "next/server";
import { getAll, create } from "@/lib/store";
import { withAuth } from "@/lib/withAuth";

const STATUS_VALUES = ["active", "inactive", "pending"] as const;

export const GET = withAuth(async () => {
  return NextResponse.json({ success: true, data: getAll() });
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { title, description, status } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 });
    }
    if (!STATUS_VALUES.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const item = create({ title: title.trim(), description: description.trim(), status });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
