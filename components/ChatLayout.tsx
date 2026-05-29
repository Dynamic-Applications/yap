"use client";

import { useEffect, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

interface Message {
    message: string;
    userId: string;
    name: string;
    timestamp: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface ChatLayoutProps {
    friendId?: string;
    friendName?: string;
}

export default function ChatLayout({ friendId, friendName }: ChatLayoutProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [channel, setChannel] = useState<string>("");
    const bottomRef = useRef<HTMLDivElement>(null);

    // Fetch current user
    useEffect(() => {
        if (!friendId) return;
        
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) return;
                setUser(data.user);

                const ch = [data.user.id, friendId].sort().join("-");
                setChannel(ch);
                console.log("Subscribing to channel:", ch);

                const pusherClient = getPusherClient();
                const pusherChannel = pusherClient.subscribe(ch);

                pusherClient.connection.bind("connected", () =>
                    console.log("Pusher connected"),
                    setConnected(true),
                );
                pusherClient.connection.bind("disconnected", () =>
                    console.log("Pusher disconnected"),
                    setConnected(false),
                );
                if (pusherClient.connection.state === "connected")
                    setConnected(true);

                pusherChannel.bind("message", (data: Message) => {
                    console.log("Received message:", data);
                    setMessages((prev) => [...prev, data]);
                });
            });
    }, [friendId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !channel){
            console.log("sendMessage blocked:", {newMessage, user, channel})
            return;
        }
        console.log("Sending to channel:", channel);
        await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: newMessage,
                userId: user.id,
                name: user.name,
                channel,
            }),
        });

        setNewMessage("");
    };

    function getInitials(name: string) {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    return (
        <main className="flex flex-col h-[calc(100vh-64px)]">
            <div className="w-full flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(friendName ?? "")}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{friendName ?? ""}</p>
                        <p
                            className={`text-xs ${connected ? "text-green-500" : "text-yellow-500"}`}
                        >
                            {connected ? "Connected" : "Connecting..."}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, index) => {
                        const isMe = msg.userId === user?.id;
                        return (
                            <div
                                key={index}
                                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                    {getInitials(msg.name)}
                                </div>
                                <div
                                    className={`max-w-[70%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                                >
                                    <span className="text-xs text-gray-400">
                                        {isMe ? "You" : msg.name}
                                    </span>
                                    <div
                                        className={`px-4 py-2 rounded-2xl text-sm ${
                                            isMe
                                                ? "bg-blue-500 text-white rounded-br-sm"
                                                : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                                        }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={sendMessage}
                    className="p-4 border-t border-gray-100"
                >
                    <div className="flex gap-3 items-center">
                        {user && (
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {getInitials(user.name)}
                            </div>
                        )}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder={
                                user
                                    ? `Message ${friendName ?? ""}...`
                                    : "Sign in to chat"
                            }
                            disabled={!user}
                        />
                        <button
                            type="submit"
                            disabled={!connected || !user}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                connected && user
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
