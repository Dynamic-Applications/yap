"use client";

import { MessageCircle, Users, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
    { label: "Chats", icon: MessageCircle, href: "/chat" },
    { label: "Groups", icon: Users, href: "/groups" },
    { label: "Profile", icon: UserCircle, href: "/profile" },
];

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white border-t border-gray-100 pb-safe pt-2 z-50">
            {tabs.map(({ label, icon: Icon, href }) => {
                const active = pathname.startsWith(href);
                return (
                    <button
                        key={label}
                        onClick={() => router.push(href)}
                        className="flex flex-col items-center gap-1 px-6 py-1"
                    >
                        <Icon
                            size={24}
                            className={
                                active ? "text-green-600" : "text-gray-400"
                            }
                            strokeWidth={active ? 2 : 1.5}
                        />
                        <span
                            className={`text-[11px] ${active ? "text-green-600 font-medium" : "text-gray-400"}`}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
