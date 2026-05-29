"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

interface PendingRequest {
    id: string;
    name: string;
    email: string;
    sender_id: string;
    created_at: string;
}

interface Friend {
    id: string;
    name: string;
    email: string;
}

export default function FriendRequests({ userId }: { userId: string }) {
    const [email, setEmail] = useState("");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/friends")
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setFriends(data.friends);
                    setPending(data.pending);
                }
            });

        // Listen for incoming friend requests
        const pusherClient = getPusherClient();
        const channel = pusherClient.subscribe(`user-${userId}`);

        channel.bind(
            "friend-request",
            (data: {
                requestId: string;
                senderName: string;
                senderEmail: string;
            }) => {
                setPending((prev) => [
                    ...prev,
                    {
                        id: data.requestId,
                        name: data.senderName,
                        email: data.senderEmail,
                        sender_id: "",
                        created_at: new Date().toISOString(),
                    },
                ]);
            },
        );

        channel.bind("friend-accepted", () => {
            fetch("/api/friends")
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) setFriends(data.friends);
                });
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(`user-${userId}`);
        };
    }, [userId]);

    const sendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const res = await fetch("/api/friends/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();

        setMessage(res.ok ? "Friend request sent!" : data.error);
        if (res.ok) setEmail("");
        setLoading(false);
    };

    const respond = async (requestId: string, action: "accept" | "reject") => {
        const res = await fetch("/api/friends/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, action }),
        });
        if (res.ok) {
            setPending((prev) => prev.filter((r) => r.id !== requestId));
            if (action === "accept") {
                fetch("/api/friends")
                    .then((r) => r.json())
                    .then((data) => {
                        if (data.success) setFriends(data.friends);
                    });
            }
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-8 space-y-8">
            {/* Send request */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Add Friend</h2>
                <form onSubmit={sendRequest} className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter their email"
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send"}
                    </button>
                </form>
                {message && (
                    <p
                        className={`text-sm mt-2 ${message === "Friend request sent!" ? "text-green-600" : "text-red-500"}`}
                    >
                        {message}
                    </p>
                )}
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">
                        Friend Requests
                    </h2>
                    <div className="space-y-3">
                        {pending.map((req) => (
                            <div
                                key={req.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {req.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {req.email}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            respond(req.id, "accept")
                                        }
                                        className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() =>
                                            respond(req.id, "reject")
                                        }
                                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-200"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends list */}
            <div>
                <h2 className="text-lg font-semibold mb-4">
                    Friends ({friends.length})
                </h2>
                {friends.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No friends yet. Send a request above!
                    </p>
                ) : (
                    <div className="space-y-2">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white"
                            >
                                <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                                    {friend.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {friend.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {friend.email}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
