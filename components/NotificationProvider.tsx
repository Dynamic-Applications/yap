"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { getPusherClient } from "@/lib/pusher-client";

type NotificationContextType = {
    totalUnread: number;
    unreadByChannel: Record<string, number>;
    markChannelRead: (channel: string) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used within provider");
    return ctx;
}

export default function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [unreadByChannel, setUnreadByChannel] = useState<
        Record<string, number>
    >(() => {
        if (typeof window === "undefined") return {};
        try {
            const raw = window.localStorage.getItem("unreadByChannel");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const channelRef = useRef<any>(null);

    const persistUnread = useCallback((next: Record<string, number>) => {
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(
                    "unreadByChannel",
                    JSON.stringify(next),
                );
            } catch {}
        }
    }, []);

    const addUnread = useCallback(
        (chatChannel: string) => {
            setUnreadByChannel((prev) => {
                const next = { ...prev };
                next[chatChannel] = (next[chatChannel] || 0) + 1;
                persistUnread(next);
                return next;
            });
        },
        [persistUnread],
    );

    useEffect(() => {
        let mounted = true;

        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!mounted || !data?.success) return;
                const userId = data.user.id;
                const pusher = getPusherClient();
                const ch = `user-${userId}`;

                try {
                    if (channelRef.current) {
                        pusher.unsubscribe(ch);
                    }
                } catch {}

                const channel = pusher.subscribe(ch);
                channelRef.current = channel;

                channel.unbind("message");
                channel.bind("message", (payload: any) => {
                    const chatChannel = payload.channel;
                    addUnread(chatChannel);

                    if (
                        typeof window !== "undefined" &&
                        "Notification" in window
                    ) {
                        if (Notification.permission === "granted") {
                            new Notification(payload.name || "New message", {
                                body: payload.message,
                            });
                        } else if (Notification.permission !== "denied") {
                            Notification.requestPermission().then((perm) => {
                                if (perm === "granted") {
                                    new Notification(
                                        payload.name || "New message",
                                        {
                                            body: payload.message,
                                        },
                                    );
                                }
                            });
                        }
                    }
                });
            })
            .catch(() => {});

        return () => {
            mounted = false;
            if (channelRef.current) {
                try {
                    channelRef.current.unbind("message");
                } catch {}
            }
        };
    }, [addUnread]);

    const markChannelRead = useCallback(
        (channel: string) => {
            setUnreadByChannel((prev) => {
                if (!prev[channel]) return prev;
                const next = { ...prev };
                delete next[channel];
                persistUnread(next);
                return next;
            });
        },
        [persistUnread],
    );

    const totalUnread = Object.values(unreadByChannel).reduce(
        (a, b) => a + b,
        0,
    );

    return (
        <NotificationContext.Provider
            value={{ totalUnread, unreadByChannel, markChannelRead }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
