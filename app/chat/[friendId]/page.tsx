"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";
import MobileNav from "@/components/MobileNav";

interface Friend {
    id: string;
    name: string;
    email: string;
}

export default function FriendChatPage() {
    const { friendId } = useParams();
    const router = useRouter();
    const [friend, setFriend] = useState<Friend | null>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) router.push("/auth/signin");
            });

        fetch(`/api/friends/${friendId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setFriend(data.friend);
                else router.push("/friends");
            });
    }, [friendId, router]);

    if (!friend) return null;

    return (
        <>
        <ChatLayout friendId={friendId as string} friendName={friend.name} />
        <MobileNav />
        </>
    );
}
