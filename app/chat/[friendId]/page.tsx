"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";
import MobileNav from "@/components/MobileNav";

export default function ChatFriendPage() {
    const { friendId } = useParams<{ friendId: string }>();
    const [friendName, setFriendName] = useState("");

    useEffect(() => {
        fetch("/api/friends")
            .then((r) => r.json())
            .then((data) => {
                if (data?.success) {
                    const friend = data.friends.find(
                        (f: { id: string }) => f.id === friendId,
                    );
                    if (friend) setFriendName(friend.name);
                }
            });
    }, [friendId]);

    return (
        <>
            <ChatLayout
                key={friendId}
                friendId={friendId}
                friendName={friendName}
            />
            <MobileNav />
        </>
    );
}
