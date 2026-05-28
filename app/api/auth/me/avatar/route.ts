// import { NextRequest, NextResponse } from "next/server";
// import { put } from "@vercel/blob";
// import { getTokenFromRequest } from "@/lib/jwt";
// import { updateUserAvatar } from "@/lib/users";

// export async function POST(request: NextRequest) {
//     const payload = await getTokenFromRequest(request);
//     if (!payload) {
//         return NextResponse.json(
//             { success: false, error: "Unauthorized" },
//             { status: 401 },
//         );
//     }

//     const form = await request.formData();
//     const file = form.get("avatar") as File;
//     if (!file) {
//         return NextResponse.json(
//             { success: false, error: "No file provided" },
//             { status: 400 },
//         );
//     }

//     if (!file.type.startsWith("image/")) {
//         return NextResponse.json(
//             { success: false, error: "File must be an image" },
//             { status: 400 },
//         );
//     }

//     if (file.size > 2 * 1024 * 1024) {
//         return NextResponse.json(
//             { success: false, error: "Image must be under 2MB" },
//             { status: 400 },
//         );
//     }

//     const blob = await put(`avatars/${payload.sub}`, file, {
//         access: "public",
//         addRandomSuffix: false,
//         allowOverwrite: true,
//     });
//     await updateUserAvatar(payload.sub, blob.url);

//     return NextResponse.json({ success: true, avatarUrl: blob.url });
// }
