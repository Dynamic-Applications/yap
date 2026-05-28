"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: "User" | "Admin" | "SuperAdmin";
}

interface AuthContextType {
    user: AuthUser | null;
    setUser: (user: AuthUser | null) => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    signOut: async () => {},
});

const INACTIVITY_TIMEOUT = 10 * 60 * 1000;
const ACTIVITY_EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "scroll",
    "click",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const { status } = useSession();
    const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const signOutRef = useRef<(() => Promise<void>) | null>(null);

    async function fetchMe() {
        try {
            const r = await fetch("/api/auth/me");
            const data = await r.json();
            console.log("fetchMe response:", data);
            if (data.success) setUser(data.user);
            else setUser(null);
        } catch {}
    }

    function clearInactivityTimer() {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
            inactivityTimer.current = null;
        }
    }

    async function signOut() {
        clearInactivityTimer();
        await nextAuthSignOut({ redirect: false });
        await fetch("/api/auth/signout", { method: "POST" });
        setUser(null);
        window.location.href = "/";
    }

    // keep signOut ref up to date
    useEffect(() => {
        signOutRef.current = signOut;
    });

    function resetInactivityTimer() {
        clearInactivityTimer();
        inactivityTimer.current = setTimeout(() => {
            signOutRef.current?.();
        }, INACTIVITY_TIMEOUT);
    }


    // fetch on mount
    useEffect(() => {
        fetchMe();
    }, []);

    // sync with NextAuth session
    useEffect(() => {
        if (status === "authenticated") {
            fetchMe();
        } else if (status === "unauthenticated") {
            fetchMe(); // let the server decide — /api/auth/me returns null if no session
        }
    }, [status]);

    // inactivity timer
    useEffect(() => {
        if (!user) {
            clearInactivityTimer();
            return;
        }
        resetInactivityTimer();
        ACTIVITY_EVENTS.forEach((e) =>
            window.addEventListener(e, resetInactivityTimer),
        );
        return () => {
            clearInactivityTimer();
            ACTIVITY_EVENTS.forEach((e) =>
                window.removeEventListener(e, resetInactivityTimer),
            );
        };
    }, [user]);

    // poll every 2 minutes
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(
            async () => {
                const r = await fetch("/api/auth/me");
                const data = await r.json();
                if (!data.success) signOutRef.current?.();
            },
            2 * 60 * 1000,
        );
        return () => clearInterval(interval);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
