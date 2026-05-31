"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatLayout from "@/components/ChatLayout";
import MobileNav from "@/components/MobileNav";
import CreateGroupModal from "@/components/CreateGroupModal";
import GroupSettingsModal from "@/components/GroupSettingsModal";
import { Users } from "lucide-react";
import Image from "next/image";

interface Friend {
    id: string;
    name: string;
    email: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    isCreator: boolean;
}

interface Group {
    id: string;
    name: string;
    avatar_url?: string;
    created_by?: string;
    members?: Member[];
}

interface CurrentUser {
    id: string;
    name: string;
    email: string;
}

function getInitials(name: string) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);

    const activeFriendId = searchParams.get("friendId");
    const activeGroupId = searchParams.get("groupId");

    const activeFriend = friends.find((f) => f.id === activeFriendId);
    const activeGroup = groups.find((g) => g.id === activeGroupId);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) {
                    router.push("/auth/signin");
                    return;
                }
                setCurrentUser(data.user);
                return Promise.all([
                    fetch("/api/friends").then((r) => r.json()),
                    fetch("/api/groups").then((r) => r.json()),
                ]);
            })
            .then((results) => {
                if (!results) return;
                const [friendsData, groupsData] = results;
                if (friendsData?.success) setFriends(friendsData.friends);
                if (groupsData?.success) setGroups(groupsData.groups);
            })
            .finally(() => setLoading(false));
    }, [router]);

    const openGroupSettings = async () => {
        if (!activeGroup) return;
        if (!activeGroup.members) {
            const res = await fetch(`/api/groups/${activeGroup.id}`);
            const data = await res.json();
            if (data.success) {
                setGroups((prev) =>
                    prev.map((g) =>
                        g.id === activeGroup.id ? { ...g, ...data.group } : g,
                    ),
                );
            }
        }
        setShowGroupSettings(true);
    };

    const handleGroupGone = () => {
        setShowGroupSettings(false);
        setGroups((prev) => prev.filter((g) => g.id !== activeGroup?.id));
        router.push("/chat");
    };

    const activeId = activeFriendId ?? activeGroupId;
    const activeName = activeFriend?.name ?? activeGroup?.name ?? "";

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-sm text-gray-400">
                Loading...
            </div>
        );

    return (
        <>
            {showCreateGroup && (
                <CreateGroupModal
                    friends={friends}
                    onClose={() => setShowCreateGroup(false)}
                    onCreated={(groupId, groupName, avatarUrl) => {
                        setGroups((prev) => [
                            {
                                id: groupId,
                                name: groupName,
                                avatar_url: avatarUrl,
                            },
                            ...prev,
                        ]);
                        setShowCreateGroup(false);
                        router.push(`/chat?groupId=${groupId}`);
                    }}
                />
            )}

            {showGroupSettings && activeGroup && currentUser && (
                <GroupSettingsModal
                    groupId={activeGroup.id}
                    groupName={activeGroup.name}
                    groupAvatarUrl={activeGroup.avatar_url}
                    members={activeGroup.members ?? []}
                    currentUserId={currentUser.id}
                    isCreator={activeGroup.created_by === currentUser.id}
                    onClose={() => setShowGroupSettings(false)}
                    onLeft={handleGroupGone}
                    onDeleted={handleGroupGone}
                    onUpdated={(changes) => {
                        setGroups((prev) =>
                            prev.map((g) =>
                                g.id === activeGroup.id
                                    ? {
                                          ...g,
                                          ...(changes.name && {
                                              name: changes.name,
                                          }),
                                          ...(changes.avatarUrl && {
                                              avatar_url: changes.avatarUrl,
                                          }),
                                      }
                                    : g,
                            ),
                        );
                    }}
                />
            )}

            <div className="flex h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <div
                    className={`w-full md:w-80 md:border-r border-gray-100 flex-shrink-0 flex flex-col ${activeId ? "hidden md:flex" : "flex"}`}
                >
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h1 className="text-xl font-bold">Chats</h1>
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="flex items-center gap-1 text-xs text-blue-500 font-medium hover:text-blue-600"
                        >
                            <Users size={14} />
                            New Group
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-2">
                        {/* Groups */}
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() =>
                                    router.push(`/chat?groupId=${group.id}`)
                                }
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                    activeGroupId === group.id
                                        ? "bg-blue-50"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                                    {group.avatar_url ? (
                                        <Image
                                            src={group.avatar_url}
                                            alt={group.name}
                                            width={48}
                                            height={48}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        getInitials(group.name)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">
                                        {group.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Group
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* DMs */}
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                onClick={() =>
                                    router.push(`/chat?friendId=${friend.id}`)
                                }
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                    activeFriendId === friend.id
                                        ? "bg-blue-50"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    {getInitials(friend.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">
                                        {friend.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {friend.email}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {friends.length === 0 && groups.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
                                <p className="text-gray-400 text-sm">
                                    No chats yet.
                                </p>
                                <button
                                    onClick={() => router.push("/friends")}
                                    className="mt-3 text-blue-500 text-sm font-medium"
                                >
                                    Add friends to start chatting
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat panel */}
                <div
                    className={`flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}
                >
                    {activeId ? (
                        <>
                            {/* Mobile back + group settings trigger */}
                            <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                                <button
                                    onClick={() => router.push("/chat")}
                                    className="text-blue-500 text-sm font-medium"
                                >
                                    ← Back
                                </button>
                                {activeGroup && (
                                    <button
                                        onClick={openGroupSettings}
                                        className="ml-auto text-sm text-gray-500 font-medium hover:text-gray-700"
                                    >
                                        {activeGroup.name}
                                    </button>
                                )}
                            </div>

                            {/* Desktop group settings trigger */}
                            {activeGroup && (
                                <button
                                    onClick={openGroupSettings}
                                    className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                        {activeGroup.avatar_url ? (
                                            <Image
                                                src={activeGroup.avatar_url}
                                                alt={activeGroup.name}
                                                width={32}
                                                height={32}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            getInitials(activeGroup.name)
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {activeGroup.name}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                        Group info ›
                                    </span>
                                </button>
                            )}

                            <ChatLayout
                                key={activeId}
                                friendId={activeFriendId ?? undefined}
                                groupId={activeGroupId ?? undefined}
                                friendName={activeName}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                            Select a conversation
                        </div>
                    )}
                </div>
            </div>
            <MobileNav />
        </>
    );
}

export default function Page() {
    return (
        <Suspense>
            <ChatPage />
        </Suspense>
    );
}
