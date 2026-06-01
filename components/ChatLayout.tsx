"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";

interface Message {
    id: string;
    message: string;
    userId: string;
    name: string;
    timestamp: string;
    created_at?: string;
    avatar_url?: string | null;
    status?: "pending" | "delivered" | "read";
    clientMessageId?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
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
    const [friendAvatar, setFriendAvatar] = useState<string | null>(null);
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const [lastReadBy, setLastReadBy] = useState<string | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastReadSentAtRef = useRef<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    const formatDateHeader = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatTimeLabel = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isSameDay = (a: string, b: string) => {
        const d1 = new Date(a);
        const d2 = new Date(b);
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const sendTypingStatus = useCallback(
        (typing: boolean) => {
            if (!channel) return;
            fetch("/api/messages/typing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channel, typing }),
            }).catch(() => {});
        },
        [channel],
    );

    const sendReadReceipt = useCallback(() => {
        if (!user || !channel) return;
        const lastIncoming = [...messages]
            .reverse()
            .find((m) => m.userId !== user.id);
        if (!lastIncoming) return;

        const lastReadAt = lastIncoming.created_at ?? lastIncoming.timestamp;
        if (lastReadSentAtRef.current === lastReadAt) return;

        lastReadSentAtRef.current = lastReadAt;
        fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel, lastReadAt }),
        }).catch(() => {});
    }, [channel, messages, user]);

    const getTypingLabel = () => {
        const names = Object.values(typingUsers);
        if (!names.length) return null;
        if (names.length === 1) return `${names[0]} is typing...`;
        if (names.length === 2)
            return `${names[0]} and ${names[1]} are typing...`;
        return `${names.length} people are typing...`;
    };

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

                // if this is a 1:1 chat, try to fetch friend's avatar from friends list
                if (friendId) {
                    fetch(`/api/friends`)
                        .then((r) => r.json())
                        .then((fr) => {
                            if (fr?.success) {
                                const f = fr.friends.find(
                                    (x: any) => x.id === friendId,
                                );
                                if (f) setFriendAvatar(f.avatar_url ?? null);
                            }
                        })
                        .catch(() => {});
                }

                // if this is a group chat, fetch group details to get avatar
                if (groupId) {
                    fetch(`/api/groups/${groupId}`)
                        .then((r) => r.json())
                        .then((data) => {
                            if (data?.success && data.group) {
                                setGroupAvatar(data.group.avatar_url ?? null);
                            }
                        })
                        .catch(() => {});
                }

                fetch(`/api/messages?channel=${ch}`)
                    .then((r) => r.json())
                    .then((res) => {
                        if (res.success) {
                            setMessages(
                                res.messages.map((m: any) => ({
                                    id: String(m.id),
                                    message: m.message,
                                    userId: m.sender_id,
                                    name: m.name,
                                    avatar_url: m.avatar_url ?? null,
                                    timestamp: m.created_at,
                                    created_at: m.created_at,
                                    status:
                                        m.sender_id === data.user.id
                                            ? "delivered"
                                            : undefined,
                                })),
                            );
                        }
                    })
                    .catch(() => {});

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
                pusherChannel.unbind("typing");
                pusherChannel.unbind("read");

                pusherChannel.bind("message", (data: any) => {
                    const incoming: Message = {
                        id:
                            data.clientMessageId ??
                            `${data.userId}-${data.timestamp}`,
                        message: data.message,
                        userId: data.userId,
                        name: data.name,
                        avatar_url: data.avatar_url ?? null,
                        timestamp: data.timestamp,
                        created_at: data.timestamp,
                        clientMessageId: data.clientMessageId,
                        status:
                            data.userId === user?.id ? "delivered" : undefined,
                    };

                    setMessages((prev) => {
                        if (data.clientMessageId && data.userId === user?.id) {
                            const existingIndex = prev.findIndex(
                                (msg) =>
                                    msg.clientMessageId ===
                                    data.clientMessageId,
                            );
                            if (existingIndex !== -1) {
                                const next = [...prev];
                                next[existingIndex] = {
                                    ...next[existingIndex],
                                    ...incoming,
                                    status: "delivered",
                                };
                                return next;
                            }
                        }

                        return [...prev, incoming];
                    });
                });

                pusherChannel.bind("typing", (data: any) => {
                    if (data.userId === user?.id) return;

                    setTypingUsers((prev) => {
                        if (data.typing) {
                            return { ...prev, [data.userId]: data.name };
                        }

                        const next = { ...prev };
                        delete next[data.userId];
                        return next;
                    });
                });

                pusherChannel.bind("read", (data: any) => {
                    if (data.userId === user?.id) return;
                    setLastReadBy(data.name);
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.userId === user?.id
                                ? { ...msg, status: "read" }
                                : msg,
                        ),
                    );
                });
            });

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            sendTypingStatus(false);
            const pusherClient = getPusherClient();
            if (currentChannel) pusherClient.unsubscribe(currentChannel);
            pusherClient.connection.unbind("connected");
            pusherClient.connection.unbind("disconnected");
        };
    }, [friendId, groupId, sendTypingStatus, user]);

    useEffect(() => {
        sendReadReceipt();
    }, [sendReadReceipt]);

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
        if (channel) {
            updateTyping(true);
        }
    };

    const updateTyping = (typing: boolean) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        sendTypingStatus(typing);

        if (typing) {
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingStatus(false);
            }, 1400);
        }
    };

    const handleMessageInput = (text: string) => {
        setNewMessage(text);
        if (!channel) return;
        updateTyping(true);
    };

    const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !channel) return;

        const clientMessageId =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `local-${Date.now()}`;
        const now = new Date().toISOString();

        setMessages((prev) => [
            ...prev,
            {
                id: clientMessageId,
                message: newMessage.trim(),
                userId: user.id,
                name: user.name,
                avatar_url: user.avatar_url ?? null,
                timestamp: now,
                created_at: now,
                status: "pending",
                clientMessageId,
            },
        ]);

        setNewMessage("");
        setShowEmoji(false);
        updateTyping(false);

        await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: newMessage.trim(),
                userId: user.id,
                name: user.name,
                channel,
                clientMessageId,
            }),
        }).catch(() => {});
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
                    <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center">
                        {groupId ? (
                            groupAvatar ? (
                                <Image
                                    src={groupAvatar}
                                    alt={friendName ?? ""}
                                    width={36}
                                    height={36}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div
                                    className={`h-9 w-9 rounded-full ${"bg-purple-500"} flex items-center justify-center text-white text-sm font-semibold`}
                                >
                                    {getInitials(friendName ?? "")}
                                </div>
                            )
                        ) : friendAvatar ? (
                            <Image
                                src={friendAvatar}
                                alt={friendName ?? ""}
                                width={36}
                                height={36}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div
                                className={`h-9 w-9 rounded-full ${"bg-blue-500"} flex items-center justify-center text-white text-sm font-semibold`}
                            >
                                {getInitials(friendName ?? "")}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {friendName ?? ""}
                        </p>
                        <p
                            className={`text-xs ${getTypingLabel() ? "text-green-500" : connected ? "text-green-500" : "text-yellow-500"}`}
                        >
                            {getTypingLabel() ??
                                (connected ? "Connected" : "Connecting...")}
                        </p>
                        {lastReadBy && !getTypingLabel() ? (
                            <p className="text-[11px] text-gray-500">
                                Seen by {lastReadBy}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                    {messages.map((msg, index) => {
                        const isMe = msg.userId === user?.id;
                        const previous = index > 0 ? messages[index - 1] : null;
                        const currentTimestamp =
                            msg.created_at ?? msg.timestamp;
                        const previousTimestamp = previous
                            ? (previous.created_at ?? previous.timestamp)
                            : null;
                        const showDateHeader =
                            !previousTimestamp ||
                            !isSameDay(currentTimestamp, previousTimestamp);

                        return (
                            <div key={msg.id} className="space-y-3">
                                {showDateHeader && (
                                    <div className="flex justify-center">
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500">
                                            {formatDateHeader(currentTimestamp)}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`flex items-end gap-2 ${
                                        isMe ? "flex-row-reverse" : "flex-row"
                                    }`}
                                >
                                    <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                        {msg.avatar_url ? (
                                            <Image
                                                src={msg.avatar_url}
                                                alt={msg.name}
                                                width={32}
                                                height={32}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                                {getInitials(msg.name)}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`max-w-[70%] flex flex-col gap-1 ${
                                            isMe ? "items-end" : "items-start"
                                        }`}
                                    >
                                        {groupId && !isMe && (
                                            <span className="text-[11px] text-gray-400">
                                                {msg.name}
                                            </span>
                                        )}
                                        <div
                                            className={`px-4 py-2 rounded-2xl text-sm ${
                                                isMe
                                                    ? "bg-blue-500 text-white rounded-br-sm"
                                                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                                            }`}
                                        >
                                            {msg.message}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                                            <span>
                                                {formatTimeLabel(
                                                    currentTimestamp,
                                                )}
                                            </span>
                                            {isMe && msg.status && (
                                                <span
                                                    className={`inline-flex items-center gap-1 ${
                                                        msg.status === "read"
                                                            ? "text-green-300"
                                                            : msg.status ===
                                                                "pending"
                                                              ? "text-gray-300"
                                                              : "text-gray-400"
                                                    }`}
                                                >
                                                    {msg.status ===
                                                    "pending" ? (
                                                        <Loader2
                                                            size={12}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Check size={12} />
                                                    )}
                                                    {msg.status === "pending"
                                                        ? "Sending..."
                                                        : msg.status === "read"
                                                          ? "Read"
                                                          : "Delivered"}
                                                </span>
                                            )}
                                        </div>
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
                            <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                {user.avatar_url ? (
                                    <Image
                                        src={user.avatar_url}
                                        alt={user.name}
                                        width={32}
                                        height={32}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                        {getInitials(user.name)}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) =>
                                    handleMessageInput(e.target.value)
                                }
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
