"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";

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
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
    const [pendingUnfriendId, setPendingUnfriendId] = useState<string | null>(null);
    const router = useRouter();

    const pendingUnfriend = friends.find((f) => f.id === pendingUnfriendId);

    useEffect(() => {
        fetch("/api/friends")
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setFriends(data.friends);
                    setPending(data.pending);
                }
            });

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

        if (res.ok) {
            setMessageType("success");
            setMessage(
                data.invited
                    ? `No account found — we sent ${email} an invite!`
                    : "Friend request sent!",
            );
            setEmail("");
        } else {
            setMessageType("error");
            setMessage(data.error);
        }

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

    const confirmUnfriend = async () => {
        if (!pendingUnfriendId) return;
        const res = await fetch(`/api/friends/${pendingUnfriendId}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setFriends((prev) => prev.filter((f) => f.id !== pendingUnfriendId));
        }
        setPendingUnfriendId(null);
    };

    return (
        <>
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
                        <p className={`text-sm mt-2 ${messageType === "success" ? "text-green-600" : "text-red-500"}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Pending requests */}
                {pending.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Friend Requests</h2>
                        <div className="space-y-3">
                            {pending.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{req.name}</p>
                                        <p className="text-xs text-gray-400">{req.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => respond(req.id, "accept")}
                                            className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => respond(req.id, "reject")}
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
                                    <div
                                        onClick={() => router.push(`/chat?friendId=${friend.id}`)}
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                    >
                                        <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                            {friend.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{friend.name}</p>
                                            <p className="text-xs text-gray-400">{friend.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPendingUnfriendId(friend.id)}
                                        aria-label={`Unfriend ${friend.name}`}
                                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Unfriend confirmation dialog */}
            {pendingUnfriendId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-xl">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Unfriend {pendingUnfriend?.name}?
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                You'll need to send a new request to reconnect.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPendingUnfriendId(null)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUnfriend}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                                Unfriend
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}