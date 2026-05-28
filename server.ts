import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const wss = new WebSocketServer({ noServer: true });
    const clients = new Set<WebSocket>();

    wss.on("connection", (ws) => {
        clients.add(ws);
        console.log("Client connected, total:", clients.size);

        ws.on("message", (data) => {
            const message = data.toString();
            if (message === '{"event":"ping"}') return; // ignore pings

            // Broadcast to all connected clients
            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });

        ws.on("close", () => {
            clients.delete(ws);
            console.log("Client disconnected, total:", clients.size);
        });
    });

    server.on("upgrade", (req, socket, head) => {
        const { pathname } = parse(req.url!);
        if (pathname === "/api/ws") {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        } else if (pathname?.startsWith("/_next")) {
            app.getUpgradeHandler()(req, socket, head);
        } else {
            socket.destroy(); // only destroy truly unknown paths
        }
    });

    server.listen(3000, () => {
        console.log("> Ready on http://localhost:3000");
    });
});
