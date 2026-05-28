"use client";

import { MessageCircle, Users, UserCircle, LogIn } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
const tabs = [
    { label: "Chats", icon: MessageCircle, href: "/chat" },
    { label: "Groups", icon: Users, href: "/groups" },
];

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    return (
        <>
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

                {/* Profile / Sign in tab */}
                <button
                    onClick={() =>
                        session ? router.push("/profile") : router.push("/auth/signin")
                    }
                    className="flex flex-col items-center gap-1 px-6 py-1"
                >
                    {session ? (
                        <UserCircle
                            size={24}
                            className={
                                pathname.startsWith("/profile")
                                    ? "text-green-600"
                                    : "text-gray-400"
                            }
                            strokeWidth={
                                pathname.startsWith("/profile") ? 2 : 1.5
                            }
                        />
                    ) : (
                        <LogIn
                            size={24}
                            className="text-gray-400"
                            strokeWidth={1.5}
                        />
                    )}
                    <span
                        className={`text-[11px] ${pathname.startsWith("/profile") && session ? "text-green-600 font-medium" : "text-gray-400"}`}
                    >
                        {session ? "Profile" : "Sign in"}
                    </span>
                </button>
            </nav>
        </>
    );
}
