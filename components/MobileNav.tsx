"use client";

import { MessageCircle, Users, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

const tabs = [
    { label: "Chats", icon: MessageCircle, href: "/chat" },
    { label: "Friends", icon: Users, href: "/friends" },
    { label: "Profile", icon: UserCircle, href: "/profile" },
];

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data?.success && data.user?.avatar_url)
                    setAvatar(data.user.avatar_url);
            })
            .catch(() => {});
    }, []);

    return (
        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white border-t border-gray-100 pb-6 pt-2 z-50">
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
                                <Image
                                    src={avatar}
                                    alt="Profile"
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <Icon
                                size={24}
                                className={
                                    active ? "text-green-600" : "text-gray-400"
                                }
                                strokeWidth={active ? 2 : 1.5}
                            />
                        )}
                        {label !== "Profile" && (
                            <span
                                className={`text-[11px] ${active ? "text-green-600 font-medium" : "text-gray-400"}`}
                            >
                                {label}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
