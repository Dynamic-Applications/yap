"use client";

import { useEffect, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";

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
    groupId?: string;
    friendName?: string;
}

export default function ChatLayout({
    friendId,
    groupId,
    friendName,
}: ChatLayoutProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [channel, setChannel] = useState<string>("");
    const [showEmoji, setShowEmoji] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!friendId && !groupId) return;

        setMessages([]);
        setConnected(false);
        let currentChannel = "";

        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) return;
                setUser(data.user);

                const ch = groupId
                    ? `group-${groupId}`
                    : [data.user.id, friendId].sort().join("-");

                currentChannel = ch;
                setChannel(ch);

                fetch(`/api/messages?channel=${ch}`)
                    .then((r) => r.json())
                    .then((res) => {
                        if (res.success) {
                            setMessages(
                                res.messages.map((m: any) => ({
                                    message: m.message,
                                    userId: m.sender_id,
                                    name: m.name,
                                    timestamp: m.created_at,
                                })),
                            );
                        }
                    });

                const pusherClient = getPusherClient();
                pusherClient.unsubscribe(ch);
                const pusherChannel = pusherClient.subscribe(ch);

                const onConnected = () => setConnected(true);
                const onDisconnected = () => setConnected(false);

                pusherClient.connection.bind("connected", onConnected);
                pusherClient.connection.bind("disconnected", onDisconnected);
                if (pusherClient.connection.state === "connected")
                    setConnected(true);

                pusherChannel.unbind("message");
                pusherChannel.bind("message", (data: Message) => {
                    setMessages((prev) => [...prev, data]);
                });
            });

        return () => {
            const pusherClient = getPusherClient();
            if (currentChannel) pusherClient.unsubscribe(currentChannel);
            pusherClient.connection.unbind("connected");
            pusherClient.connection.unbind("disconnected");
        };
    }, [friendId, groupId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                emojiRef.current &&
                !emojiRef.current.contains(e.target as Node)
            ) {
                setShowEmoji(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage((prev) => prev + emojiData.emoji);
    };

    const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !channel) return;

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
        setShowEmoji(false);
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
        <main className="flex flex-col h-[calc(100vh-64px)] pb-16">
            <div className="w-full flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3">
                    <div
                        className={`h-9 w-9 rounded-full ${groupId ? "bg-purple-500" : "bg-blue-500"} flex items-center justify-center text-white text-sm font-semibold`}
                    >
                        {getInitials(friendName ?? "")}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {friendName ?? ""}
                        </p>
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

                {/* Emoji picker */}
                {showEmoji && (
                    <div
                        ref={emojiRef}
                        className="absolute bottom-24 left-4 z-50"
                    >
                        <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            theme={Theme.LIGHT}
                            height={380}
                            width={320}
                        />
                    </div>
                )}

                {/* Input */}
                <form
                    onSubmit={sendMessage}
                    className="p-4 border-t border-gray-100"
                >
                    <div className="flex gap-2 items-center">
                        {user && (
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {getInitials(user.name)}
                            </div>
                        )}
                        <div className="flex-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 py-3 focus:outline-none text-sm bg-transparent"
                                placeholder={
                                    user
                                        ? `Message ${friendName ?? ""}...`
                                        : "Sign in to chat"
                                }
                                disabled={!user}
                            />
                            <button
                                type="button"
                                onClick={() => setShowEmoji((prev) => !prev)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Smile size={20} />
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={!connected || !user}
                            className={`px-5 py-3 rounded-lg font-medium transition-all ${
                                connected && user
                                    ? "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm"
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
