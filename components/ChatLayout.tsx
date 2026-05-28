"use client";

import { useEffect, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";

interface Message {
    message: string;
    userId: string;
    name: string;
    timestamp: string;
}

export default function ChatLayout() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const channel = pusherClient.subscribe("chat");

        pusherClient.connection.bind("connected", () => setConnected(true));
        pusherClient.connection.bind("disconnected", () => setConnected(false));

        // set initial state
        if (pusherClient.connection.state === "connected") setConnected(true);

        channel.bind("message", (data: Message) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe("chat");
        };
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: newMessage,
                userId: "anonymous",
                name: "Anonymous",
            }),
        });

        setNewMessage("");
    };

    return (
        <main className="flex flex-col h-[calc(100vh-64px)]">
            <div className="w-full flex flex-col flex-1 overflow-hidden">
                {/* Status bar */}
                <div
                    className={`px-6 py-3 text-sm font-medium ${
                        connected
                            ? "bg-green-50 text-green-700 border-b border-green-100"
                            : "bg-yellow-50 text-yellow-700 border-b border-yellow-100"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-yellow-500"}`}
                        />
                        {connected ? "Connected" : "Connecting..."}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <p className="text-xs text-gray-400 mb-1">
                                {msg.name}
                            </p>
                            <p className="text-gray-800 font-medium">
                                {msg.message}
                            </p>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-6">
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
                            disabled={!connected}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                connected
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
