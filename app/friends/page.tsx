"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FriendRequests from "@/components/FriendRequests";
import { ArrowLeft } from "lucide-react";

export default function FriendsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) router.push("/auth/signin");
                else setUserId(data.user.id);
            });
    }, [router]);

    if (!userId) return null;

    return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft size={16} />
                Back
            </button>
            <FriendRequests userId={userId} />
            </div>);
}
