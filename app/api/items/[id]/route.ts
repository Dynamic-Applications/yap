import { NextRequest, NextResponse } from "next/server";
import { getById, update, remove } from "@/lib/store";
import { withAuth } from "@/lib/withAuth";

const STATUS_VALUES = ["active", "inactive", "pending"] as const;

export const GET = withAuth(async (_request: NextRequest, ctx) => {
  const item = getById(ctx.params.id);
  if (!item) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: item });
});

export const PUT = withAuth(async (request: NextRequest, ctx) => {
  const item = getById(ctx.params.id);
  if (!item) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }

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

  const updatedItem = update(ctx.params.id, {
    title: title.trim(),
    description: description.trim(),
    status,
  });

  return NextResponse.json({ success: true, data: updatedItem });
});

export const DELETE = withAuth(async (_request: NextRequest, ctx) => {
  const removed = remove(ctx.params.id);
  if (!removed) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { id: ctx.params.id } });
});
