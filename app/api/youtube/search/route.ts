import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const pageToken = searchParams.get("pageToken") ?? "";

    if (!query) {
        return NextResponse.json(
            { success: false, error: "Query is required" },
            { status: 400 },
        );
    }

    const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "12",
        key: process.env.YOUTUBE_API_KEY!,
        ...(pageToken && { pageToken }),
    });

    const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`,
    );
    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json(
            {
                success: false,
                error: data.error?.message ?? "YouTube API error",
            },
            { status: res.status },
        );
    }

    return NextResponse.json({
        success: true,
        items: data.items,
        nextPageToken: data.nextPageToken ?? null,
        prevPageToken: data.prevPageToken ?? null,
        totalResults: data.pageInfo?.totalResults ?? 0,
    });
}
