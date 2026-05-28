"use client";
import { useEffect, useRef, useState } from "react";

export default function ChatLayout() {
    const [messages, setMessages] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [connectionStatus, setConnectionStatus] = useState<
        "connected" | "disconnected" | "connecting"
    >("connecting");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnectionStatus("connected");
        };

        ws.onclose = () => {
            setConnectionStatus("disconnected");
        };

        ws.onmessage = (event) => {
            setMessages((prevMessages) => [...prevMessages, event.data]);
        };

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(`{"event":"ping"}`);
            }
        }, 29000);

        return () => {
            clearInterval(pingInterval);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(newMessage);
            setNewMessage("");
        }
    };

    return (
        <main className="flex flex-col h-[calc(100vh-64px)]">
            <div className="w-full flex flex-col flex-1 overflow-hidden">
                <div
                    className={`px-6 py-3 text-sm font-medium ${
                        connectionStatus === "connected"
                            ? "bg-green-50 text-green-700 border-b border-green-100"
                            : connectionStatus === "disconnected"
                              ? "bg-red-50 text-red-700 border-b border-red-100"
                              : "bg-yellow-50 text-yellow-700 border-b border-yellow-100"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                connectionStatus === "connected"
                                    ? "bg-green-500"
                                    : connectionStatus === "disconnected"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                            }`}
                        ></div>
                        Status: {connectionStatus}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md"
                        >
                            <p className="text-gray-800 font-medium">
                                {message}
                            </p>
                        </div>
                    ))}
                </div>

                <form
                    onSubmit={sendMessage}
                    className="p-6"
                >
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Type your message..."
                        />
                        <button
                            type="submit"
                            disabled={connectionStatus !== "connected"}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                connectionStatus === "connected"
                                    ? "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
