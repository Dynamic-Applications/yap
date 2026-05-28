// import { NextRequest } from "next/server";

// const clients = new Set<WebSocket>();

// export function GET(request: NextRequest) {
//     const { socket, response } = (request as any).socket.server;

//     // @ts-ignore
//     if (!request.headers.get("upgrade")?.includes("websocket")) {
//         return new Response("Expected WebSocket", { status: 426 });
//     }

//     // Next.js App Router doesn't natively support WebSockets.
//     // Use a custom server instead — see below.
//     return new Response("WebSocket not supported in App Router", {
//         status: 500,
//     });
// }
