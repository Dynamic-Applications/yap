"use client";

import { MessageCircle, Users, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useNotifications } from "@/components/NotificationProvider";

const tabs = [
    { label: "Chats", icon: MessageCircle, href: "/chat" },
    { label: "Friends", icon: Users, href: "/friends" },
    { label: "Profile", icon: UserCircle, href: "/profile" },
];

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const notifications = (() => {
        try {
            return useNotifications();
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data?.success && data.user?.avatar_url)
                    setAvatar(data.user.avatar_url);
                if (data?.success && data.user?.id) {
                    try {
                        const pusher =
                            require("@/lib/pusher-client").getPusherClient();
                        const updatePresence = () => {
                            setIsActive(document.visibilityState === "visible");
                        };
                        updatePresence();
                        document.addEventListener(
                            "visibilitychange",
                            updatePresence,
                        );
                        window.addEventListener("focus", updatePresence);
                        window.addEventListener("blur", updatePresence);
                        pusher.connection.bind("connected", () =>
                            setIsActive(true),
                        );
                        pusher.connection.bind("disconnected", () =>
                            setIsActive(false),
                        );
                    } catch {}
                }
            })
            .catch(() => {});
    }, []);

    return (
        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-700 pb-6 pt-2 z-50">
            {tabs.map(({ label, icon: Icon, href }) => {
                const active = pathname.startsWith(href);
                return (
                    <button
                        key={label}
                        onClick={() => router.push(href)}
                        aria-label={label}
                        className="flex flex-col items-center gap-1 px-6 py-1"
                    >
                        {label === "Profile" && avatar ? (
                            <div className="relative h-9 w-9 rounded-full overflow-hidden">
                                <div
                                    className={`h-full w-full rounded-full ${isActive ? "ring-2 ring-green-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950" : ""}`}
                                >
                                    <Image
                                        src={avatar}
                                        alt="Profile"
                                        fill
                                        sizes="36px"
                                        className="object-cover rounded-full"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Icon
                                size={24}
                                className={
                                    active
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-gray-400 dark:text-slate-500"
                                }
                                strokeWidth={active ? 2 : 1.5}
                            />
                        )}
                        {label !== "Profile" && (
                            <span className="relative">
                                <span
                                    className={`text-[11px] ${
                                        active
                                            ? "text-green-600 dark:text-green-400 font-medium"
                                            : "text-gray-400 dark:text-slate-500"
                                    }`}
                                >
                                    {label}
                                </span>
                                {label === "Chats" &&
                                    notifications &&
                                    notifications.totalUnread > 0 && (
                                        <span className="absolute -top-2 -right-4 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium leading-none text-white rounded-full bg-red-600">
                                            {notifications.totalUnread}
                                        </span>
                                    )}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
