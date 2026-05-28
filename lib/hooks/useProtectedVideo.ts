"use client";

import { useAuth } from "@/lib/context/auth-context";

export function useProtectedVideo() {
    const { user } = useAuth();

    function handleVideoClick(e: React.MouseEvent, videoId: string) {
        if (!user) {
            e.preventDefault();
            sessionStorage.setItem(
                "redirectAfterLogin",
                `https://www.youtube.com/watch?v=${videoId}`,
            );
            window.dispatchEvent(new CustomEvent("open-login-dialog"));
        }
    }

    return { handleVideoClick, isAuthenticated: !!user };
}
