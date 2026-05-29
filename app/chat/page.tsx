//

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";
import MobileNav from "@/components/MobileNav";
import { Suspense } from "react";

interface Friend {
    id: string;
    name: string;
    email: string;
}

function getInitials(name: string) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    const activeFriendId = searchParams.get("friendId");
    const activeFriend = friends.find((f) => f.id === activeFriendId);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) {
                    router.push("/auth/signin");
                    return;
                }
                return fetch("/api/friends");
            })
            .then((r) => r?.json())
            .then((data) => {
                if (data?.success) setFriends(data.friends);
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-sm text-gray-400">
                Loading...
            </div>
        );

    return (
        <>
            <div className="flex h-[calc(100vh-64px)]">
                {/* Friends sidebar */}
                <div
                    className={`w-full md:w-80 md:border-r border-gray-100 flex-shrink-0 flex flex-col ${activeFriendId ? "hidden md:flex" : "flex"}`}
                >
                    <div className="px-4 py-4 border-b border-gray-100">
                        <h1 className="text-xl font-bold">Chats</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {friends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <p className="text-gray-400 text-sm">
                                    No chats yet.
                                </p>
                                <button
                                    onClick={() => router.push("/friends")}
                                    className="mt-3 text-blue-500 text-sm font-medium"
                                >
                                    Add friends to start chatting
                                </button>
                            </div>
                        ) : (
                            <div className="py-2">
                                {friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        onClick={() =>
                                            router.push(
                                                `/chat?friendId=${friend.id}`,
                                            )
                                        }
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                            activeFriendId === friend.id
                                                ? "bg-blue-50"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                            {getInitials(friend.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">
                                                {friend.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {friend.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat panel */}
                <div
                    className={`flex-1 flex-col ${activeFriendId ? "flex" : "hidden md:flex"}`}
                >
                    {activeFriend ? (
                        <>
                            {/* Back button — mobile only */}
                            <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                                <button
                                    onClick={() => router.push("/chat")}
                                    className="text-blue-500 text-sm font-medium"
                                >
                                    ← Back
                                </button>
                            </div>
                            <ChatLayout
                                key={activeFriendId}
                                friendId={activeFriendId ?? undefined}
                                friendName={activeFriend.name}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                            Select a conversation
                        </div>
                    )}
                </div>
            </div>
            <MobileNav />
        </>
    );
}

// useSearchParams requires Suspense in Next.js 14+
export default function Page() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen text-sm text-gray-400">
                    Loading...
                </div>
            }
        >
            <ChatPage />
        </Suspense>
    );
}