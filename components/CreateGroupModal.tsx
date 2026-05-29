"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Friend {
    id: string;
    name: string;
    email: string;
}

interface Props {
    friends: Friend[];
    onClose: () => void;
    onCreated: (groupId: string, groupName: string) => void;
}

export default function CreateGroupModal({
    friends,
    onClose,
    onCreated,
}: Props) {
    const [name, setName] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const toggle = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const create = async () => {
        if (!name.trim() || selected.length === 0) {
            setError("Enter a group name and select at least one member.");
            return;
        }
        setLoading(true);
        const res = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, memberIds: selected }),
        });
        const data = await res.json();
        if (data.success) {
            onCreated(data.groupId, name);
        } else {
            setError(data.error);
        }
        setLoading(false);
    };

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">New Group</h2>
                    <button onClick={onClose}>
                        <X
                            size={20}
                            className="text-gray-400 hover:text-gray-600"
                        />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="space-y-2 max-h-56 overflow-y-auto">
                    {friends.map((friend) => (
                        <div
                            key={friend.id}
                            onClick={() => toggle(friend.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selected.includes(friend.id)
                                    ? "bg-blue-50 border border-blue-200"
                                    : "hover:bg-gray-50 border border-transparent"
                            }`}
                        >
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                {getInitials(friend.name)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    {friend.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {friend.email}
                                </p>
                            </div>
                            <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    selected.includes(friend.id)
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-gray-300"
                                }`}
                            >
                                {selected.includes(friend.id) && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                    onClick={create}
                    disabled={loading}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading
                        ? "Creating..."
                        : `Create Group${selected.length > 0 ? ` (${selected.length + 1})` : ""}`}
                </button>
            </div>
        </div>
    );
}
